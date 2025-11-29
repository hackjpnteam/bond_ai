import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import connectDB from '@/lib/mongodb'
import Message from '@/models/Message'
import User from '@/models/User'
import mongoose from 'mongoose'

export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    await connectDB()
    
    const userId = new mongoose.Types.ObjectId(user.id)
    
    // ユーザーが参加している会話を取得
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: userId },
            { recipient: userId }
          ]
        }
      },
      {
        $addFields: {
          otherUserId: {
            $cond: {
              if: { $eq: ['$sender', userId] },
              then: '$recipient',
              else: '$sender'
            }
          }
        }
      },
      {
        $group: {
          _id: '$otherUserId',
          lastMessage: { $last: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: {
                if: { 
                  $and: [
                    { $eq: ['$recipient', userId] },
                    { $eq: ['$read', false] }
                  ]
                },
                then: 1,
                else: 0
              }
            }
          },
          updatedAt: { $max: '$createdAt' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'otherUser'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'lastMessage.sender',
          foreignField: '_id',
          as: 'lastMessage.sender'
        }
      },
      {
        $addFields: {
          'lastMessage.sender': { $arrayElemAt: ['$lastMessage.sender', 0] }
        }
      },
      {
        $sort: { updatedAt: -1 }
      }
    ])

    // 会話データを整形（otherUserが見つからない場合はスキップ）
    const formattedConversations = conversations
      .filter(conv => conv.otherUser && conv.otherUser.length > 0)
      .map(conv => ({
        _id: conv._id.toString(),
        participants: [
          {
            _id: user.id,
            name: user.name,
            email: user.email,
            image: user.image
          },
          {
            _id: conv.otherUser[0]._id.toString(),
            name: conv.otherUser[0].name,
            email: conv.otherUser[0].email,
            image: conv.otherUser[0].image
          }
        ],
        lastMessage: conv.lastMessage ? {
          content: conv.lastMessage.content,
          sender: conv.lastMessage.sender ? {
            _id: conv.lastMessage.sender._id.toString(),
            name: conv.lastMessage.sender.name,
            email: conv.lastMessage.sender.email,
            image: conv.lastMessage.sender.image
          } : null,
          createdAt: conv.lastMessage.createdAt,
          read: conv.lastMessage.read
        } : undefined,
        unreadCount: conv.unreadCount,
        updatedAt: conv.updatedAt
      }))

    return NextResponse.json({
      success: true,
      conversations: formattedConversations
    })

  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})