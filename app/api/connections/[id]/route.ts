import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import dbConnect from '@/lib/mongodb'
import ConnectionRequest from '@/models/ConnectionRequest'
import Connection from '@/models/Connection'
import User from '@/models/User'
import Notification from '@/models/Notification'
import { createNotificationWithEmail } from '@/lib/email-notifications'

type ConnectionStatus = 'pending' | 'accepted' | 'declined' | 'blocked'

const requestStatusMap: Record<string, ConnectionStatus> = {
  pending: 'pending',
  accepted: 'accepted',
  rejected: 'declined',
  cancelled: 'declined'
}

const connectionStatusMap: Record<string, ConnectionStatus> = {
  active: 'accepted',
  blocked: 'blocked',
  removed: 'declined'
}

const buildUserPayload = (user: any, currentUserId: string) => ({
  id: user?._id?.toString() === currentUserId ? 'current-user' : user?._id?.toString(),
  username: user?.username || user?.email?.split('@')[0] || 'user',
  name: user?.name || 'Unknown User',
  company: user?.company || user?.position || '',
  profileImage: user?.profileImage || user?.image || null
})

const mapRequestToConnection = (request: any, currentUserId: string) => ({
  id: request._id.toString(),
  fromUser: buildUserPayload(request.requester, currentUserId),
  toUser: buildUserPayload(request.recipient, currentUserId),
  status: requestStatusMap[request.status] || 'pending',
  message: request.message || '',
  createdAt: request.createdAt?.toISOString?.() || new Date().toISOString(),
  updatedAt: request.updatedAt?.toISOString?.() || new Date().toISOString()
})

const mapConnectionToPayload = (connection: any, currentUserId: string) => {
  const initiator = connection.initiator
  const users = Array.isArray(connection.users) ? connection.users : []
  const partner = users.find(
    (user: any) => user?._id?.toString() !== initiator?._id?.toString()
  )

  const fromUser = buildUserPayload(initiator, currentUserId)
  const toUser =
    initiator?._id?.toString() === currentUserId
      ? buildUserPayload(partner || initiator, currentUserId)
      : buildUserPayload(
          users.find((u: any) => u?._id?.toString() === currentUserId) || initiator,
          currentUserId
        )

  return {
    id: connection._id.toString(),
    fromUser,
    toUser,
    status: connectionStatusMap[connection.status] || 'accepted',
    createdAt: connection.createdAt?.toISOString?.() || new Date().toISOString(),
    updatedAt: connection.updatedAt?.toISOString?.() || new Date().toISOString()
  }
}

const extractId = (request: NextRequest) => {
  const segments = request.nextUrl.pathname.split('/')
  return segments[segments.length - 1]
}

export const PATCH = requireAuth(async (request: NextRequest, authUser) => {
  try {
    const { status } = await request.json()
    if (!status || !['accepted', 'declined', 'blocked'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be accepted, declined, or blocked' },
        { status: 400 }
      )
    }

    await dbConnect()

    const currentUser = await User.findOne({ email: authUser.email })
      .select('name email username company image profileImage')
      .lean()

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const id = extractId(request)
    const currentUserId = currentUser._id.toString()

    const connectionRequest = await ConnectionRequest.findById(id)
      .populate('requester', 'name username email company image profileImage position')
      .populate('recipient', 'name username email company image profileImage position')

    if (!connectionRequest) {
      const connection = await Connection.findById(id)
        .populate('users', 'name username email company image profileImage position')
        .populate('initiator', 'name username email company image profileImage position')

      if (!connection) {
        return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
      }

      if (!connection.users.some((user: any) => user._id.toString() === currentUserId)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }

      if (status !== 'blocked') {
        return NextResponse.json(
          { error: 'Only blocking is supported for existing connections' },
          { status: 400 }
        )
      }

      if (connection.status === 'blocked') {
        return NextResponse.json({
          success: true,
          connection: mapConnectionToPayload(connection, currentUserId),
          message: 'すでにブロック済みです'
        })
      }

      connection.status = 'blocked'
      await connection.save()

      return NextResponse.json({
        success: true,
        connection: mapConnectionToPayload(connection, currentUserId),
        message: '接続をブロックしました'
      })
    }

    if (connectionRequest.recipient._id.toString() !== currentUserId) {
      return NextResponse.json(
        { error: 'Only recipients can respond to requests' },
        { status: 403 }
      )
    }

    if (connectionRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'Request has already been processed' },
        { status: 400 }
      )
    }

    let responseMessage = ''

    if (status === 'accepted') {
      connectionRequest.status = 'accepted'
      connectionRequest.respondedAt = new Date()
      await connectionRequest.save()

      const connection = new Connection({
        users: [connectionRequest.requester._id, connectionRequest.recipient._id],
        initiator: connectionRequest.requester._id,
        status: 'active',
        strength: 1
      })

      await connection.save()

      await User.findByIdAndUpdate(connectionRequest.requester._id, {
        $addToSet: { connections: connectionRequest.recipient._id }
      })

      await User.findByIdAndUpdate(connectionRequest.recipient._id, {
        $addToSet: { connections: connectionRequest.requester._id }
      })

      await createNotificationWithEmail(Notification, User, {
        recipient: connectionRequest.requester._id,
        type: 'connection_accepted',
        title: '接続リクエストが承認されました',
        message: `${connectionRequest.recipient.name}さんが接続リクエストを承認しました`,
        data: {
          userId: connectionRequest.recipient._id,
          userName: connectionRequest.recipient.name,
          userImage: connectionRequest.recipient.profileImage || connectionRequest.recipient.image
        }
      })

      responseMessage = `${connectionRequest.requester.name}さんとの接続を承認しました`
    } else {
      connectionRequest.status = 'rejected'
      connectionRequest.respondedAt = new Date()
      await connectionRequest.save()
      responseMessage = `${connectionRequest.requester.name}さんとの接続を拒否しました`
    }

    return NextResponse.json({
      success: true,
      connection: mapRequestToConnection(connectionRequest, currentUserId),
      message: responseMessage
    })
  } catch (error) {
    console.error('Error updating connection:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})

export const DELETE = requireAuth(async (request: NextRequest, authUser) => {
  try {
    await dbConnect()

    const currentUser = await User.findOne({ email: authUser.email })
      .select('_id')
      .lean()

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const id = extractId(request)
    const currentUserId = currentUser._id.toString()

    const connectionRequest = await ConnectionRequest.findById(id)

    if (connectionRequest) {
      const requesterId = connectionRequest.requester.toString()
      const recipientId = connectionRequest.recipient.toString()

      if (requesterId !== currentUserId && recipientId !== currentUserId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }

      await ConnectionRequest.findByIdAndDelete(id)

      return NextResponse.json({
        success: true,
        message: '接続リクエストを削除しました'
      })
    }

    const connection = await Connection.findById(id)

    if (!connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
    }

    if (!connection.users.some((userId: any) => userId.toString() === currentUserId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (connection.users.length === 2) {
      await User.findByIdAndUpdate(connection.users[0], {
        $pull: { connections: connection.users[1] }
      })
      await User.findByIdAndUpdate(connection.users[1], {
        $pull: { connections: connection.users[0] }
      })
    }

    await Connection.findByIdAndDelete(id)

    return NextResponse.json({
      success: true,
      message: '接続を削除しました'
    })
  } catch (error) {
    console.error('Error deleting connection:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})

export const GET = requireAuth(async (request: NextRequest, authUser) => {
  try {
    await dbConnect()

    const currentUser = await User.findOne({ email: authUser.email })
      .select('_id')
      .lean()

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const id = extractId(request)
    const currentUserId = currentUser._id.toString()

    const connectionRequest = await ConnectionRequest.findById(id)
      .populate('requester', 'name username email company image profileImage position')
      .populate('recipient', 'name username email company image profileImage position')
      .lean()

    if (connectionRequest) {
      return NextResponse.json({
        success: true,
        connection: mapRequestToConnection(connectionRequest, currentUserId)
      })
    }

    const connection = await Connection.findById(id)
      .populate('users', 'name username email company image profileImage position')
      .populate('initiator', 'name username email company image profileImage position')
      .lean()

    if (!connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
    }

    if (!connection.users.some((user: any) => user._id.toString() === currentUserId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      connection: mapConnectionToPayload(connection, currentUserId)
    })
  } catch (error) {
    console.error('Error fetching connection:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
