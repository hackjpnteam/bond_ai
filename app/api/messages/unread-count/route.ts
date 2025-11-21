import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import connectDB from '@/lib/mongodb'
import Message from '@/models/Message'
import mongoose from 'mongoose'

export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    await connectDB()
    
    const userId = new mongoose.Types.ObjectId(user.id)
    
    // 受信した未読メッセージ数を取得
    const unreadCount = await Message.countDocuments({
      recipient: userId,
      read: false
    })
    
    return NextResponse.json({ count: unreadCount })
  } catch (error) {
    console.error('Error fetching unread message count:', error)
    return NextResponse.json(
      { error: 'Failed to fetch unread message count' },
      { status: 500 }
    )
  }
})