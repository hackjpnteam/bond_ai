import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import connectDB from '@/lib/mongodb'
import Notification from '@/models/Notification'

export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    await connectDB()
    
    const count = await Notification.countDocuments({
      recipient: user.id,
      read: { $ne: true }
    })
    
    return NextResponse.json({ count })
  } catch (error) {
    console.error('Error fetching notification count:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notification count' },
      { status: 500 }
    )
  }
})