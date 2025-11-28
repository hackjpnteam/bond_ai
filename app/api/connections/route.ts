import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import dbConnect from '@/lib/mongodb'
import ConnectionRequest from '@/models/ConnectionRequest'
import Connection from '@/models/Connection'
import User from '@/models/User'
import Notification from '@/models/Notification'
import { createNotificationWithEmail } from '@/lib/email-notifications'
import type { FilterQuery } from 'mongoose'

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

export const GET = requireAuth(async (request: NextRequest, authUser) => {
  try {
    await dbConnect()

    const currentUser = await User.findOne({ email: authUser.email })
      .select('name email username company image profileImage')
      .lean()

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const status = request.nextUrl.searchParams.get('status')
    const type = request.nextUrl.searchParams.get('type')

    const requestQuery: FilterQuery<any> =
      type === 'sent'
        ? { requester: currentUser._id }
        : type === 'received'
          ? { recipient: currentUser._id }
          : {
              $or: [{ requester: currentUser._id }, { recipient: currentUser._id }]
            }

    if (status === 'pending') {
      requestQuery.status = 'pending'
    } else if (status === 'accepted') {
      requestQuery.status = 'accepted'
    } else if (status === 'declined') {
      requestQuery.status = { $in: ['rejected', 'cancelled'] }
    }

    const requests = await ConnectionRequest.find(requestQuery)
      .populate('requester', 'name username email company image profileImage position')
      .populate('recipient', 'name username email company image profileImage position')
      .sort('-createdAt')
      .lean()

    const requestConnections = requests.map((req) =>
      mapRequestToConnection(req, currentUser._id.toString())
    )

    const shouldIncludeConnections =
      (!type || type === 'all') && status !== 'pending' && status !== 'declined'

    let connectionEntries: any[] = []

    if (shouldIncludeConnections) {
      const connectionStatuses =
        status === 'blocked'
          ? ['blocked']
          : ['active']

      connectionEntries = await Connection.find({
        users: currentUser._id,
        status: { $in: connectionStatuses }
      })
        .populate('users', 'name username email company image profileImage position')
        .populate('initiator', 'name username email company image profileImage position')
        .sort('-createdAt')
        .lean()
    }

    const mappedConnections = connectionEntries.map((conn) =>
      mapConnectionToPayload(conn, currentUser._id.toString())
    )

    const connections =
      status === 'accepted'
        ? [...requestConnections.filter((c) => c.status === 'accepted'), ...mappedConnections]
        : status === 'blocked'
          ? mappedConnections
          : [...requestConnections, ...mappedConnections]

    const stats = {
      total: connections.length,
      pending: connections.filter((c) => c.status === 'pending').length,
      accepted: connections.filter((c) => c.status === 'accepted').length,
      declined: connections.filter((c) => c.status === 'declined').length
    }

    return NextResponse.json({
      success: true,
      connections,
      stats
    })
  } catch (error) {
    console.error('Error fetching connections:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})

export const POST = requireAuth(async (request: NextRequest, authUser) => {
  try {
    const { toUserId, message } = await request.json()

    if (!toUserId) {
      return NextResponse.json({ error: 'Target user ID is required' }, { status: 400 })
    }

    await dbConnect()

    const requester = await User.findOne({ email: authUser.email })
    if (!requester) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (requester._id.toString() === toUserId) {
      return NextResponse.json(
        { error: 'Cannot send a connection request to yourself' },
        { status: 400 }
      )
    }

    const recipient = await User.findById(toUserId)
    if (!recipient) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 })
    }

    const existingRequest = await ConnectionRequest.findOne({
      $or: [
        { requester: requester._id, recipient: toUserId, status: 'pending' },
        { requester: toUserId, recipient: requester._id, status: 'pending' }
      ]
    })

    if (existingRequest) {
      return NextResponse.json(
        { error: 'Connection request already exists' },
        { status: 409 }
      )
    }

    const existingConnection = await Connection.findOne({
      users: { $all: [requester._id, toUserId] },
      status: { $nin: ['removed'] }
    })

    if (existingConnection) {
      return NextResponse.json(
        { error: 'You are already connected with this user' },
        { status: 409 }
      )
    }

    const connectionRequest = await ConnectionRequest.create({
      requester: requester._id,
      recipient: toUserId,
      message,
      status: 'pending'
    })

    await createNotificationWithEmail(Notification, User, {
      recipient: toUserId,
      type: 'connection_request',
      title: '新しい接続リクエスト',
      message: `${requester.name}さんから接続リクエストが届きました`,
      data: {
        requestId: connectionRequest._id,
        requesterId: requester._id,
        requesterName: requester.name,
        requesterImage: requester.image
      }
    })

    await connectionRequest.populate([
      { path: 'requester', select: 'name username email company image profileImage position' },
      { path: 'recipient', select: 'name username email company image profileImage position' }
    ])

    return NextResponse.json({
      success: true,
      connection: mapRequestToConnection(connectionRequest, requester._id.toString()),
      message: `${recipient.name}さんに接続リクエストを送信しました`
    })
  } catch (error) {
    console.error('Error creating connection:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
