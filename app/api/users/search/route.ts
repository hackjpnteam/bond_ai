import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth-middleware'
import connectDB from '@/lib/mongodb'
import mongoose from 'mongoose'

export async function GET(request: NextRequest) {
  try {
    const authUser = await validateSession(request)
    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    await connectDB()
    const db = mongoose.connection.db

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    
    if (!query || query.length < 2) {
      return NextResponse.json({ users: [] })
    }

    // MongoDBでユーザーを検索
    const searchRegex = { $regex: query, $options: 'i' }
    const users = await db.collection('users').find({
      $and: [
        // 自分以外のユーザー
        { _id: { $ne: new mongoose.Types.ObjectId(authUser.id) } },
        // 名前またはメールで検索
        {
          $or: [
            { name: searchRegex },
            { email: searchRegex },
            { username: searchRegex }
          ]
        }
      ]
    }).limit(10).toArray()

    // レスポンス用にデータを整形
    const formattedUsers = users.map(user => ({
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      username: user.username || getUsername(user),
      image: user.image
    }))

    return NextResponse.json({
      success: true,
      users: formattedUsers
    })

  } catch (error) {
    console.error('Error searching users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ユーザー名を生成する関数
function getUsername(user: any): string {
  if (user.email === 'tomura@hackjpn.com') {
    return 'tomura'
  } else if (user.email === 'team@hackjpn.com') {
    return 'team'
  } else if (user.name === 'Hikaru Tomura') {
    return 'hikaru'
  } else {
    return user.email?.split('@')[0] || user.name
  }
}