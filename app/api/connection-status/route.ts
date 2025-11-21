import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth-middleware'
import connectDB from '@/lib/mongodb'
import mongoose from 'mongoose'
import ConnectionRequest from '@/models/ConnectionRequest'

export async function GET(request: NextRequest) {
  try {
    // ユーザー認証チェック
    const authUser = await validateSession(request)
    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')
    
    if (!username) {
      return NextResponse.json({ error: 'Username required' }, { status: 400 })
    }

    await connectDB()
    const db = mongoose.connection.db

    // 対象ユーザーを取得
    let targetUser = null
    if (username === 'tomura' || username === 'hikaru') {
      targetUser = await db.collection('users').findOne({
        $or: [
          { email: 'tomura@hackjpn.com' },
          { name: 'Hikaru Tomura' }
        ]
      })
    } else if (username === 'team') {
      targetUser = await db.collection('users').findOne({
        $or: [
          { email: 'team@hackjpn.com' },
          { name: '瀬戸光志' }
        ]
      })
    } else if (username === 'tomtysmile5017') {
      targetUser = await db.collection('users').findOne({
        $or: [
          { email: 'tomtysmile5017@gmail.com' },
          { name: 'Rihito Tomura' },
          { _id: new mongoose.Types.ObjectId('6913d7e1e0a67ca6e82c2963') }
        ]
      })
    }

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const currentUserId = new mongoose.Types.ObjectId(authUser.id)
    const targetUserId = targetUser._id

    // 同じユーザーかチェック
    if (currentUserId.toString() === targetUserId.toString()) {
      return NextResponse.json({ status: 'self' })
    }

    // 接続状態をチェック
    const connection = await db.collection('connections').findOne({
      users: { $all: [currentUserId, targetUserId] },
      status: 'active'
    })

    if (connection) {
      return NextResponse.json({ status: 'connected' })
    }

    // 接続リクエスト状態をチェック
    const sentRequest = await ConnectionRequest.findOne({
      requester: currentUserId,
      recipient: targetUserId,
      status: 'pending'
    })

    if (sentRequest) {
      return NextResponse.json({ status: 'pending' })
    }

    const receivedRequest = await ConnectionRequest.findOne({
      requester: targetUserId,
      recipient: currentUserId,
      status: 'pending'
    })

    if (receivedRequest) {
      return NextResponse.json({ status: 'received' })
    }

    // 接続なし
    return NextResponse.json({ status: 'none' })

  } catch (error) {
    console.error('Error checking connection status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}