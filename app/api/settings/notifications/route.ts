import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'

// メール通知設定を取得
export const GET = requireAuth(async (req: NextRequest, user) => {
  try {
    await connectDB()

    const currentUser = await User.findById(user.id).select('emailNotifications')

    // デフォルト設定
    const defaultSettings = {
      enabled: true,
      connection_request: true,
      connection_accepted: true,
      message: true,
      evaluation: true,
      system: true
    }

    return NextResponse.json({
      settings: currentUser?.emailNotifications || defaultSettings
    })
  } catch (error) {
    console.error('Error fetching notification settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notification settings' },
      { status: 500 }
    )
  }
})

// メール通知設定を更新
export const PUT = requireAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json()
    const { settings } = body

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Invalid settings format' },
        { status: 400 }
      )
    }

    await connectDB()

    // 許可されたフィールドのみ更新
    const allowedFields = ['enabled', 'connection_request', 'connection_accepted', 'message', 'evaluation', 'system']
    const updateData: Record<string, boolean> = {}

    for (const field of allowedFields) {
      if (typeof settings[field] === 'boolean') {
        updateData[`emailNotifications.${field}`] = settings[field]
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid settings to update' },
        { status: 400 }
      )
    }

    const updatedUser = await User.findByIdAndUpdate(
      user.id,
      { $set: updateData },
      { new: true }
    ).select('emailNotifications')

    return NextResponse.json({
      success: true,
      settings: updatedUser?.emailNotifications
    })
  } catch (error) {
    console.error('Error updating notification settings:', error)
    return NextResponse.json(
      { error: 'Failed to update notification settings' },
      { status: 500 }
    )
  }
})
