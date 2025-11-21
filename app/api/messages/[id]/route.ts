import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth-middleware'
import connectDB from '@/lib/mongodb'
import Message from '@/models/Message'
import mongoose from 'mongoose'

// メッセージ詳細取得・既読マーク
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await validateSession(request)
    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    await connectDB()
    
    const { id } = await params
    const userId = new mongoose.Types.ObjectId(authUser.id)

    const message = await Message.findById(id)
      .populate('sender', 'name email image')
      .populate('recipient', 'name email image')
      .populate('parentMessage')

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // 送信者か受信者でなければアクセス拒否
    if (message.sender._id.toString() !== userId.toString() && 
        message.recipient._id.toString() !== userId.toString()) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // 受信者が初めて読む場合、既読マークを付ける
    if (message.recipient._id.toString() === userId.toString() && !message.read) {
      await Message.findByIdAndUpdate(id, {
        read: true,
        readAt: new Date()
      })
      message.read = true
      message.readAt = new Date()
    }

    return NextResponse.json({
      success: true,
      message
    })

  } catch (error) {
    console.error('Error fetching message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// メッセージを既読にする
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await validateSession(request)
    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    await connectDB()
    
    const { id } = await params
    const { read } = await request.json()

    const message = await Message.findById(id)
      .populate('sender', 'name email image')
      .populate('recipient', 'name email image')

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // 受信者のみが既読にできる
    if (message.recipient._id.toString() !== authUser.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    message.read = read
    if (read) {
      message.readAt = new Date()
    }
    await message.save()

    return NextResponse.json({
      success: true,
      message
    })

  } catch (error) {
    console.error('Error updating message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// メッセージ削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await validateSession(request)
    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    await connectDB()
    
    const { id } = await params
    const userId = new mongoose.Types.ObjectId(authUser.id)

    const message = await Message.findById(id)

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // 送信者か受信者でなければアクセス拒否
    if (message.sender.toString() !== userId.toString() && 
        message.recipient.toString() !== userId.toString()) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    await Message.findByIdAndDelete(id)

    return NextResponse.json({
      success: true,
      message: 'Message deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}