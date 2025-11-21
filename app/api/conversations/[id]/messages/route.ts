import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth-middleware'
import connectDB from '@/lib/mongodb'
import Message from '@/models/Message'
import mongoose from 'mongoose'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate user authentication
    const authUser = await validateSession(request)
    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    await connectDB()
    
    // Await the params Promise in Next.js 15
    const resolvedParams = await params
    const userId = new mongoose.Types.ObjectId(authUser.id)
    const otherUserId = new mongoose.Types.ObjectId(resolvedParams.id)

    // 二者間のメッセージを取得
    const messages = await Message.find({
      $or: [
        { sender: userId, recipient: otherUserId },
        { sender: otherUserId, recipient: userId }
      ]
    })
    .populate('sender', 'name email image')
    .populate('recipient', 'name email image')
    .sort({ createdAt: 1 })

    // 受信した未読メッセージを既読にする
    await Message.updateMany(
      {
        sender: otherUserId,
        recipient: userId,
        read: false
      },
      {
        read: true,
        readAt: new Date()
      }
    )

    return NextResponse.json({
      success: true,
      messages
    })

  } catch (error) {
    console.error('Error fetching conversation messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}