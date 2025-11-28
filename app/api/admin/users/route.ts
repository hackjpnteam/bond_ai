import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Connection from '@/models/Connection';
import Evaluation from '@/models/Evaluation';
import mongoose from 'mongoose';
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

// ユーザー一覧を取得
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
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

    await connectDB();

    // 検索条件
    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // 各ユーザーのつながり数と評価数を取得
    const userIds = users.map(u => u._id);

    // つながり数を集計
    const connectionCounts = await Connection.aggregate([
      {
        $match: {
          users: { $in: userIds },
          status: 'active'
        }
      },
      { $unwind: '$users' },
      {
        $group: {
          _id: '$users',
          count: { $sum: 1 }
        }
      }
    ]);
    const connectionMap = new Map(connectionCounts.map(c => [c._id.toString(), c.count]));

    // 評価数を集計
    const evaluationCounts = await Evaluation.aggregate([
      {
        $match: {
          userId: { $in: userIds.map(id => id.toString()) }
        }
      },
      {
        $group: {
          _id: '$userId',
          count: { $sum: 1 }
        }
      }
    ]);
    const evaluationMap = new Map(evaluationCounts.map(e => [e._id, e.count]));

    // ユーザーデータに統計を追加
    const usersWithStats = users.map(user => ({
      ...user,
      _id: user._id.toString(),
      connectionCount: connectionMap.get(user._id.toString()) || 0,
      evaluationCount: evaluationMap.get(user._id.toString()) || 0
    }));

    return NextResponse.json({
      users: usersWithStats,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json({ error: 'ユーザー一覧の取得に失敗しました' }, { status: 500 });
  }
}

// ユーザーを削除
export async function DELETE(request: NextRequest) {
  try {
    const admin = await checkAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
    }

    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: 'ユーザーIDが必要です' }, { status: 400 });
    }

    await connectDB();

    // 自分自身は削除できない
    if (userId === (admin as any)._id.toString()) {
      return NextResponse.json({ error: '自分自身は削除できません' }, { status: 400 });
    }

    // ユーザーを削除
    const result = await User.deleteOne({ _id: new mongoose.Types.ObjectId(userId) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 関連データの削除（つながり、評価など）
    await Connection.deleteMany({
      users: new mongoose.Types.ObjectId(userId)
    });

    await Evaluation.deleteMany({ userId: userId });

    return NextResponse.json({ success: true, message: 'ユーザーを削除しました' });

  } catch (error) {
    console.error('Admin delete user error:', error);
    return NextResponse.json({ error: 'ユーザーの削除に失敗しました' }, { status: 500 });
  }
}
