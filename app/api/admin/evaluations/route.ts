import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
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

// 評価一覧を取得
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
    const userId = searchParams.get('userId') || '';
    const companySlug = searchParams.get('companySlug') || '';

    await connectDB();

    // 検索条件
    const query: any = {};
    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { comment: { $regex: search, $options: 'i' } }
      ];
    }
    if (userId) {
      query.userId = userId;
    }
    if (companySlug) {
      query.companySlug = companySlug;
    }

    const total = await Evaluation.countDocuments(query);
    const evaluations = await Evaluation.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // ユーザー情報を取得
    const userIds = [...new Set(evaluations.map(e => e.userId))];
    const users = await User.find({ _id: { $in: userIds } })
      .select('name email image company')
      .lean();
    const userMap = new Map(users.map(u => [u._id.toString(), u]));

    // 評価にユーザー情報を追加
    const evaluationsWithUsers = evaluations.map(e => ({
      ...e,
      _id: e._id.toString(),
      user: userMap.get(e.userId) || { name: '不明', email: '' }
    }));

    return NextResponse.json({
      evaluations: evaluationsWithUsers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Admin evaluations error:', error);
    return NextResponse.json({ error: '評価一覧の取得に失敗しました' }, { status: 500 });
  }
}

// 評価を削除
export async function DELETE(request: NextRequest) {
  try {
    const admin = await checkAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
    }

    const { evaluationId } = await request.json();
    if (!evaluationId) {
      return NextResponse.json({ error: '評価IDが必要です' }, { status: 400 });
    }

    await connectDB();

    const result = await Evaluation.deleteOne({ _id: new mongoose.Types.ObjectId(evaluationId) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: '評価が見つかりません' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: '評価を削除しました' });

  } catch (error) {
    console.error('Admin delete evaluation error:', error);
    return NextResponse.json({ error: '評価の削除に失敗しました' }, { status: 500 });
  }
}
