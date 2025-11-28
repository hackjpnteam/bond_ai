import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import SearchHistory from '@/models/SearchHistory';
import { validateSession } from '@/lib/auth-middleware';

// アドミン権限チェック
async function checkAdmin(request: NextRequest) {
  const sessionUser = await validateSession(request);
  if (!sessionUser?.email) {
    return null;
  }

  await connectDB();
  const user = await User.findOne({ email: sessionUser.email }).lean();
  if (!user?.isAdmin) {
    return null;
  }

  return user;
}

// 検索履歴一覧を取得
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const mode = searchParams.get('mode') || '';
    const userId = searchParams.get('userId') || '';

    await connectDB();

    // 検索条件
    const query: any = {};
    if (search) {
      query.query = { $regex: search, $options: 'i' };
    }
    if (mode && (mode === 'company' || mode === 'person')) {
      query.mode = mode;
    }
    if (userId) {
      query.userId = userId;
    }

    const total = await SearchHistory.countDocuments(query);
    const searches = await SearchHistory.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // ユーザー情報を取得
    const userIds = [...new Set(searches.map(s => s.userId.toString()))];
    const users = await User.find({ _id: { $in: userIds } })
      .select('name email image company')
      .lean();
    const userMap = new Map(users.map(u => [u._id.toString(), u]));

    // 検索履歴にユーザー情報を追加
    const searchesWithUsers = searches.map(s => ({
      ...s,
      _id: s._id.toString(),
      userId: s.userId.toString(),
      user: userMap.get(s.userId.toString()) || { name: '不明', email: '' }
    }));

    return NextResponse.json({
      searches: searchesWithUsers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Admin searches error:', error);
    return NextResponse.json({ error: '検索履歴の取得に失敗しました' }, { status: 500 });
  }
}
