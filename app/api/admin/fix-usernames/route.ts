import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

// 既存ユーザーのusernameを修正するAPI（一度だけ実行）
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // usernameが未設定のユーザーを取得
    const usersWithoutUsername = await User.find({
      $or: [
        { username: { $exists: false } },
        { username: null },
        { username: '' }
      ]
    });

    console.log(`Found ${usersWithoutUsername.length} users without username`);

    const results = [];

    for (const user of usersWithoutUsername) {
      const baseUsername = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      let username = baseUsername;
      let counter = 1;

      // 同じusernameが存在する場合、数字を付けてユニークにする
      while (await User.exists({ username, _id: { $ne: user._id } })) {
        username = `${baseUsername}${counter}`;
        counter++;
      }

      user.username = username;
      await user.save();

      results.push({
        email: user.email,
        username: username
      });
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${results.length} users`,
      results
    });

  } catch (error) {
    console.error('Error fixing usernames:', error);
    return NextResponse.json(
      { error: 'Failed to fix usernames' },
      { status: 500 }
    );
  }
}
