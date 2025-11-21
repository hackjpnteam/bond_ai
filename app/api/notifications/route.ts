import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import connectDB from '@/lib/mongodb'
import Notification from '@/models/Notification'
import User from '@/models/User'

export const GET = requireAuth(async (req: NextRequest, user) => {
  try {
    await connectDB()

    const read = req.nextUrl.searchParams.get('read')
    
    const query: any = { recipient: user.id }
    if (read !== null) {
      query.read = read === 'true'
    }

    const notifications = await Notification.find(query)
      .sort('-createdAt')
      .limit(50)

    const unreadCount = await Notification.countDocuments({
      recipient: user.id,
      read: { $ne: true }
    })

    return NextResponse.json({ 
      notifications,
      unreadCount
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
})

export const PUT = requireAuth(async (req: NextRequest, user) => {
  try {
    const { notificationIds, read = true } = await req.json()

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { error: 'Invalid notification IDs' },
        { status: 400 }
      )
    }

    await connectDB()

    const result = await Notification.updateMany(
      {
        _id: { $in: notificationIds },
        recipient: user.id
      },
      { read }
    )

    return NextResponse.json({
      message: 'Notifications updated successfully',
      modified: result.modifiedCount
    })
  } catch (error) {
    console.error('Error updating notifications:', error)
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    )
  }
})