import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth-middleware'
import connectDB from '@/lib/mongodb'
import Message from '@/models/Message'
import User from '@/models/User'
import Notification from '@/models/Notification'
import { createNotificationWithEmail } from '@/lib/email-notifications'
import mongoose from 'mongoose'

// メッセージ一覧取得 (受信・送信両方)
export async function GET(request: NextRequest) {
  try {
    const authUser = await validateSession(request)
    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'received' // received | sent | all
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const userId = new mongoose.Types.ObjectId(authUser.id)
    let query: any = {}

    switch (type) {
      case 'received':
        query = { recipient: userId }
        break
      case 'sent':
        query = { sender: userId }
        break
      case 'all':
        query = { $or: [{ recipient: userId }, { sender: userId }] }
        break
    }

    const messages = await Message.find(query)
      .populate('sender', 'name email image')
      .populate('recipient', 'name email image')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await Message.countDocuments(query)

    return NextResponse.json({
      success: true,
      messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// メッセージ送信
export async function POST(request: NextRequest) {
  try {
    const authUser = await validateSession(request)
    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    await connectDB()
    
    const { recipientId, recipientUsername, conversationId, subject, content, parentMessageId } = await request.json()

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    if (subject && subject.length > 200) {
      return NextResponse.json({ error: 'Subject too long (max 200 characters)' }, { status: 400 })
    }

    if (content.length > 2000) {
      return NextResponse.json({ error: 'Content too long (max 2000 characters)' }, { status: 400 })
    }

    let recipient = null
    const senderId = new mongoose.Types.ObjectId(authUser.id)

    console.log('[Messages API] Creating message:', { recipientId, recipientUsername, conversationId })

    // 受信者を特定
    if (conversationId) {
      // 会話IDから受信者を特定
      console.log('[Messages API] Looking up by conversationId:', conversationId)
      recipient = await User.findById(conversationId)
    } else if (recipientId) {
      console.log('[Messages API] Looking up by recipientId:', recipientId)
      recipient = await User.findById(recipientId)
    } else if (recipientUsername) {
      console.log('[Messages API] Looking up by recipientUsername:', recipientUsername)
      // ユーザー名から受信者を特定
      if (recipientUsername === 'tomura' || recipientUsername === 'hikaru') {
        recipient = await User.findOne({
          $or: [
            { email: 'tomura@hackjpn.com' },
            { name: 'Hikaru Tomura' }
          ]
        })
      } else if (recipientUsername === 'team') {
        recipient = await User.findOne({
          $or: [
            { email: 'team@hackjpn.com' },
            { name: '瀬戸光志' }
          ]
        })
      } else {
        recipient = await User.findOne({
          $or: [
            { username: recipientUsername },
            { email: recipientUsername }
          ]
        })
      }
    }

    if (!recipient) {
      console.log('[Messages API] Recipient not found')
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 })
    }
    console.log('[Messages API] Found recipient:', recipient.name, recipient._id)

    if (recipient._id.toString() === senderId.toString()) {
      return NextResponse.json({ error: 'Cannot send message to yourself' }, { status: 400 })
    }

    const messageData: any = {
      sender: senderId,
      recipient: recipient._id,
      subject: subject?.trim() || 'Chat Message',
      content: content.trim()
    }

    if (parentMessageId) {
      messageData.parentMessage = new mongoose.Types.ObjectId(parentMessageId)
    }

    const message = await Message.create(messageData)
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email image')
      .populate('recipient', 'name email image')

    // メッセージ受信通知を作成
    try {
      await createNotificationWithEmail(Notification, User, {
        recipient: recipient._id,
        type: 'message',
        title: '新しいメッセージ',
        message: `${populatedMessage.sender.name}さんからメッセージが届きました: ${subject || 'Chat Message'}`,
        data: {
          messageId: message._id,
          senderId: senderId,
          senderName: populatedMessage.sender.name,
          subject: subject || 'Chat Message'
        }
      })
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError)
      // 通知作成に失敗してもメッセージ送信は成功とする
    }

    return NextResponse.json({
      success: true,
      message: populatedMessage
    })

  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}