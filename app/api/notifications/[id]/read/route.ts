import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import connectDB from '@/lib/mongodb'
import Notification from '@/models/Notification'

export const PUT = requireAuth(async (request: NextRequest, user) => {
  try {
    const pathname = new URL(request.url).pathname
    const match = pathname.match(/notifications\/([^/]+)\/read$/)
    const notificationId = match?.[1]

    if (!notificationId) {
      return NextResponse.json(
        { error: 'Invalid notification ID' },
        { status: 400 }
      )
    }

    await connectDB()
    
    const result = await Notification.updateOne(
      {
        _id: notificationId,
        recipient: user.id
      },
      { read: true }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Notification marked as read',
      modified: result.modifiedCount
    })
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    )
  }
})
