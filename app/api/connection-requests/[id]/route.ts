import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import dbConnect from '@/lib/mongodb'
import ConnectionRequest from '@/models/ConnectionRequest'
import User from '@/models/User'
import Connection from '@/models/Connection'
import Notification from '@/models/Notification'

export const PUT = requireAuth(async (
  req: NextRequest,
  user
) => {
  try {
    const { action } = await req.json()
    
    // Extract id from URL path
    const url = new URL(req.url)
    const pathSegments = url.pathname.split('/')
    const id = pathSegments[pathSegments.length - 1]

    if (!['accept', 'reject', 'cancel'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    await dbConnect()

    const dbUser = await User.findOne({ email: user.email })
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const request = await ConnectionRequest.findById(id)
      .populate('requester', 'name username email profileImage')
      .populate('recipient', 'name username email profileImage')

    if (!request) {
      return NextResponse.json(
        { error: 'Connection request not found' },
        { status: 404 }
      )
    }

    if (action === 'cancel') {
      if (request.requester._id.toString() !== dbUser._id.toString()) {
        return NextResponse.json(
          { error: 'You can only cancel your own requests' },
          { status: 403 }
        )
      }

      if (request.status !== 'pending') {
        return NextResponse.json(
          { error: 'Can only cancel pending requests' },
          { status: 400 }
        )
      }

      request.status = 'cancelled'
      await request.save()

      return NextResponse.json({
        message: 'Connection request cancelled',
        request
      })
    }

    if (request.recipient._id.toString() !== dbUser._id.toString()) {
      return NextResponse.json(
        { error: 'You can only respond to requests sent to you' },
        { status: 403 }
      )
    }

    if (request.status !== 'pending') {
      return NextResponse.json(
        { error: 'Request has already been processed' },
        { status: 400 }
      )
    }

    if (action === 'accept') {
      request.status = 'accepted'
      request.respondedAt = new Date()
      await request.save()

      await User.findByIdAndUpdate(request.requester._id, {
        $addToSet: { connections: request.recipient._id }
      })

      await User.findByIdAndUpdate(request.recipient._id, {
        $addToSet: { connections: request.requester._id }
      })

      const connection = new Connection({
        users: [request.requester._id, request.recipient._id],
        initiator: request.requester._id,
        status: 'active',
        strength: 1
      })

      await connection.save()

      const notification = new Notification({
        recipient: request.requester._id,
        type: 'connection_accepted',
        title: '接続リクエストが承認されました',
        message: `${request.recipient.name}さんが接続リクエストを承認しました`,
        data: {
          userId: request.recipient._id,
          userName: request.recipient.name,
          userImage: request.recipient.profileImage
        }
      })

      await notification.save()

      return NextResponse.json({
        message: 'Connection request accepted',
        request,
        connection
      })
    } else if (action === 'reject') {
      request.status = 'rejected'
      request.respondedAt = new Date()
      await request.save()

      return NextResponse.json({
        message: 'Connection request rejected',
        request
      })
    }
  } catch (error) {
    console.error('Error processing connection request:', error)
    return NextResponse.json(
      { error: 'Failed to process connection request' },
      { status: 500 }
    )
  }
})

export const DELETE = requireAuth(async (
  req: NextRequest,
  user
) => {
  // Extract id from URL path
  const url = new URL(req.url)
  const pathSegments = url.pathname.split('/')
  const id = pathSegments[pathSegments.length - 1]
  try {
    await dbConnect()

    const dbUser = await User.findOne({ email: user.email })
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const request = await ConnectionRequest.findById(id)

    if (!request) {
      return NextResponse.json(
        { error: 'Connection request not found' },
        { status: 404 }
      )
    }

    if (
      request.requester.toString() !== dbUser._id.toString() &&
      request.recipient.toString() !== dbUser._id.toString()
    ) {
      return NextResponse.json(
        { error: 'You are not authorized to delete this request' },
        { status: 403 }
      )
    }

    await ConnectionRequest.findByIdAndDelete(id)

    return NextResponse.json({
      message: 'Connection request deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting connection request:', error)
    return NextResponse.json(
      { error: 'Failed to delete connection request' },
      { status: 500 }
    )
  }
})