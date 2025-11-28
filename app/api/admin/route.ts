import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Evaluation from '@/models/Evaluation';
import Connection from '@/models/Connection';
import SearchHistory from '@/models/SearchHistory';
import Company from '@/models/Company';
import Person from '@/models/Person';
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

// 統計情報を取得
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
    }

    await connectDB();

    // ユーザー統計
    const totalUsers = await User.countDocuments();
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const newUsersLast7Days = await User.countDocuments({ createdAt: { $gte: last7Days } });
    const newUsersLast30Days = await User.countDocuments({ createdAt: { $gte: last30Days } });

    // 評価統計
    const totalEvaluations = await Evaluation.countDocuments();
    const evaluationsLast7Days = await Evaluation.countDocuments({ createdAt: { $gte: last7Days } });
    const evaluationsLast30Days = await Evaluation.countDocuments({ createdAt: { $gte: last30Days } });

    // つながり統計
    const totalConnections = await Connection.countDocuments({ status: 'active' });
    const connectionsLast7Days = await Connection.countDocuments({
      status: 'active',
      createdAt: { $gte: last7Days }
    });
    const connectionsLast30Days = await Connection.countDocuments({
      status: 'active',
      createdAt: { $gte: last30Days }
    });

    // 検索統計
    const totalSearches = await SearchHistory.countDocuments();
    const searchesLast7Days = await SearchHistory.countDocuments({ createdAt: { $gte: last7Days } });
    const searchesLast30Days = await SearchHistory.countDocuments({ createdAt: { $gte: last30Days } });

    // 会社・人物統計
    const totalCompanies = await Company.countDocuments();
    const totalPeople = await Person.countDocuments();

    // 日別ユーザー増加グラフ用データ（過去30日）
    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: last30Days } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 日別評価数グラフ用データ（過去30日）
    const evaluationGrowth = await Evaluation.aggregate([
      { $match: { createdAt: { $gte: last30Days } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 評価投稿ランキング（上位10名）
    const topEvaluators = await Evaluation.aggregate([
      {
        $group: {
          _id: '$userId',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // ユーザー情報を追加
    const topEvaluatorIds = topEvaluators.map(e => e._id);
    const evaluatorUsers = await User.find({ _id: { $in: topEvaluatorIds } }).select('name email image company').lean();
    const evaluatorMap = new Map(evaluatorUsers.map(u => [u._id.toString(), u]));

    const topEvaluatorsWithInfo = topEvaluators.map(e => ({
      ...e,
      user: evaluatorMap.get(e._id) || { name: '不明', email: '', image: '' }
    }));

    // 人気検索ワード（上位20）
    const popularSearches = await SearchHistory.aggregate([
      {
        $group: {
          _id: { query: '$query', mode: '$mode' },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    return NextResponse.json({
      users: {
        total: totalUsers,
        last7Days: newUsersLast7Days,
        last30Days: newUsersLast30Days,
        growth: userGrowth
      },
      evaluations: {
        total: totalEvaluations,
        last7Days: evaluationsLast7Days,
        last30Days: evaluationsLast30Days,
        growth: evaluationGrowth,
        topEvaluators: topEvaluatorsWithInfo
      },
      connections: {
        total: totalConnections,
        last7Days: connectionsLast7Days,
        last30Days: connectionsLast30Days
      },
      searches: {
        total: totalSearches,
        last7Days: searchesLast7Days,
        last30Days: searchesLast30Days,
        popular: popularSearches
      },
      content: {
        companies: totalCompanies,
        people: totalPeople
      }
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: '統計情報の取得に失敗しました' }, { status: 500 });
  }
}
