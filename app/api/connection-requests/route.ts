import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import dbConnect from '@/lib/mongodb'
import ConnectionRequest from '@/models/ConnectionRequest'
import User from '@/models/User'
import Notification from '@/models/Notification'

export const GET = requireAuth(async (req: NextRequest, user) => {
  try {
    await dbConnect()

    const dbUser = await User.findOne({ email: user.email })
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const type = req.nextUrl.searchParams.get('type') || 'received'

    let requests
    if (type === 'sent') {
      requests = await ConnectionRequest.find({ requester: dbUser._id })
        .populate('recipient', 'name username email profileImage company position')
        .sort('-createdAt')
    } else if (type === 'received') {
      requests = await ConnectionRequest.find({ 
        recipient: dbUser._id,
        status: 'pending'
      })
        .populate('requester', 'name username email profileImage company position')
        .sort('-createdAt')
    } else {
      requests = await ConnectionRequest.find({
        $or: [
          { requester: dbUser._id },
          { recipient: dbUser._id }
        ]
      })
        .populate('requester', 'name username email profileImage company position')
        .populate('recipient', 'name username email profileImage company position')
        .sort('-createdAt')
    }

    return NextResponse.json({ requests })
  } catch (error) {
    console.error('Error fetching connection requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch connection requests' },
      { status: 500 }
    )
  }
})

export const POST = requireAuth(async (req: NextRequest, user) => {
  try {
    const { recipientId, message } = await req.json()

    if (!recipientId) {
      return NextResponse.json(
        { error: 'Recipient ID is required' },
        { status: 400 }
      )
    }

    await dbConnect()

    const requester = await User.findOne({ email: user.email })
    if (!requester) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const recipient = await User.findById(recipientId)
    if (!recipient) {
      return NextResponse.json(
        { error: 'Recipient not found' },
        { status: 404 }
      )
    }

    if (requester._id.toString() === recipientId) {
      return NextResponse.json(
        { error: 'Cannot send request to yourself' },
        { status: 400 }
      )
    }

    const existingRequest = await ConnectionRequest.findOne({
      $or: [
        { requester: requester._id, recipient: recipientId, status: 'pending' },
        { requester: recipientId, recipient: requester._id, status: 'pending' }
      ]
    })

    if (existingRequest) {
      return NextResponse.json(
        { error: 'Connection request already exists' },
        { status: 400 }
      )
    }

    const existingConnection = await User.findOne({
      _id: requester._id,
      connections: recipientId
    })

    if (existingConnection) {
      return NextResponse.json(
        { error: 'Already connected with this user' },
        { status: 400 }
      )
    }

    const connectionRequest = new ConnectionRequest({
      requester: requester._id,
      recipient: recipientId,
      message,
      status: 'pending'
    })

    await connectionRequest.save()

    const notification = new Notification({
      recipient: recipientId,
      type: 'connection_request',
      title: '新しい接続リクエスト',
      message: `${requester.name}さんから接続リクエストが届きました`,
      data: {
        requestId: connectionRequest._id,
        requesterId: requester._id,
        requesterName: requester.name,
        requesterImage: requester.profileImage
      }
    })

    await notification.save()

    return NextResponse.json({
      message: 'Connection request sent successfully',
      request: connectionRequest
    })
  } catch (error) {
    console.error('Error creating connection request:', error)
    return NextResponse.json(
      { error: 'Failed to send connection request' },
      { status: 500 }
    )
  }
})