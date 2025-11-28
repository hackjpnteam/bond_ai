import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Evaluation from '@/models/Evaluation';
import SearchHistory from '@/models/SearchHistory';
import Connection from '@/models/Connection';
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

// CSV文字列を生成するヘルパー関数
function toCSV(data: any[], headers: { key: string; label: string }[]): string {
  // BOM for Excel UTF-8 support
  const BOM = '\uFEFF';

  // ヘッダー行
  const headerRow = headers.map(h => `"${h.label}"`).join(',');

  // データ行
  const dataRows = data.map(item => {
    return headers.map(h => {
      let value = item[h.key];
      if (value === null || value === undefined) {
        value = '';
      } else if (typeof value === 'object') {
        value = JSON.stringify(value);
      } else {
        value = String(value);
      }
      // エスケープ処理
      value = value.replace(/"/g, '""');
      return `"${value}"`;
    }).join(',');
  });

  return BOM + [headerRow, ...dataRows].join('\n');
}

export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    await connectDB();

    let csv = '';
    let filename = '';

    switch (type) {
      case 'users': {
        const users = await User.find({})
          .sort({ createdAt: -1 })
          .lean();

        // 各ユーザーのつながり数と評価数を取得
        const usersWithCounts = await Promise.all(
          users.map(async (u: any) => {
            const connectionCount = await Connection.countDocuments({
              users: u._id,
              status: 'active'
            });
            const evaluationCount = await Evaluation.countDocuments({
              userId: u._id.toString()
            });
            return {
              ...u,
              connectionCount,
              evaluationCount
            };
          })
        );

        const headers = [
          { key: '_id', label: 'ID' },
          { key: 'name', label: '名前' },
          { key: 'email', label: 'メール' },
          { key: 'company', label: '会社' },
          { key: 'position', label: '役職' },
          { key: 'role', label: 'ロール' },
          { key: 'connectionCount', label: 'つながり数' },
          { key: 'evaluationCount', label: '評価数' },
          { key: 'isAdmin', label: '管理者' },
          { key: 'createdAt', label: '登録日' },
        ];

        csv = toCSV(usersWithCounts.map((u: any) => ({
          ...u,
          _id: u._id.toString(),
          createdAt: new Date(u.createdAt).toLocaleString('ja-JP'),
          isAdmin: u.isAdmin ? 'はい' : 'いいえ',
        })), headers);
        filename = `users_${new Date().toISOString().split('T')[0]}.csv`;
        break;
      }

      case 'evaluations': {
        const evaluations = await Evaluation.find({})
          .sort({ createdAt: -1 })
          .lean();

        // ユーザー情報を取得
        const userIds = [...new Set(evaluations.map((e: any) => e.userId))];
        const users = await User.find({ _id: { $in: userIds } })
          .select('name email')
          .lean();
        const userMap = new Map(users.map((u: any) => [u._id.toString(), u]));

        const headers = [
          { key: '_id', label: 'ID' },
          { key: 'userName', label: '投稿者名' },
          { key: 'userEmail', label: '投稿者メール' },
          { key: 'companyName', label: '会社名' },
          { key: 'companySlug', label: '会社スラッグ' },
          { key: 'rating', label: '評価' },
          { key: 'relationship', label: '関係性' },
          { key: 'comment', label: 'コメント' },
          { key: 'isAnonymous', label: '匿名' },
          { key: 'createdAt', label: '投稿日' },
        ];

        csv = toCSV(evaluations.map((e: any) => {
          const user = userMap.get(e.userId) as any;
          return {
            _id: e._id.toString(),
            userName: e.isAnonymous ? '匿名' : (user?.name || '不明'),
            userEmail: e.isAnonymous ? '-' : (user?.email || '不明'),
            companyName: e.companyName,
            companySlug: e.companySlug,
            rating: e.rating,
            relationship: e.relationship || '',
            comment: e.comment || '',
            isAnonymous: e.isAnonymous ? 'はい' : 'いいえ',
            createdAt: new Date(e.createdAt).toLocaleString('ja-JP'),
          };
        }), headers);
        filename = `evaluations_${new Date().toISOString().split('T')[0]}.csv`;
        break;
      }

      case 'searches': {
        const searches = await SearchHistory.find({})
          .sort({ createdAt: -1 })
          .lean();

        // ユーザー情報を取得
        const userIds = [...new Set(searches.map((s: any) => s.userId.toString()))];
        const users = await User.find({ _id: { $in: userIds } })
          .select('name email')
          .lean();
        const userMap = new Map(users.map((u: any) => [u._id.toString(), u]));

        const headers = [
          { key: '_id', label: 'ID' },
          { key: 'userName', label: 'ユーザー名' },
          { key: 'userEmail', label: 'ユーザーメール' },
          { key: 'query', label: '検索クエリ' },
          { key: 'mode', label: 'モード' },
          { key: 'createdAt', label: '検索日時' },
        ];

        csv = toCSV(searches.map((s: any) => {
          const user = userMap.get(s.userId.toString()) as any;
          return {
            _id: s._id.toString(),
            userName: user?.name || '不明',
            userEmail: user?.email || '不明',
            query: s.query,
            mode: s.mode === 'company' ? '会社' : s.mode === 'person' ? '人物' : s.mode,
            createdAt: new Date(s.createdAt).toLocaleString('ja-JP'),
          };
        }), headers);
        filename = `searches_${new Date().toISOString().split('T')[0]}.csv`;
        break;
      }

      case 'connections': {
        const connections = await Connection.find({ status: 'active' })
          .populate('users', 'name email company')
          .sort({ createdAt: -1 })
          .lean();

        const headers = [
          { key: '_id', label: 'ID' },
          { key: 'user1Name', label: 'ユーザー1名前' },
          { key: 'user1Email', label: 'ユーザー1メール' },
          { key: 'user2Name', label: 'ユーザー2名前' },
          { key: 'user2Email', label: 'ユーザー2メール' },
          { key: 'strength', label: '関係強度' },
          { key: 'status', label: 'ステータス' },
          { key: 'createdAt', label: '接続日' },
        ];

        csv = toCSV(connections.map((c: any) => {
          const users = c.users || [];
          return {
            _id: c._id.toString(),
            user1Name: users[0]?.name || '不明',
            user1Email: users[0]?.email || '不明',
            user2Name: users[1]?.name || '不明',
            user2Email: users[1]?.email || '不明',
            strength: c.strength || 1,
            status: c.status,
            createdAt: new Date(c.createdAt).toLocaleString('ja-JP'),
          };
        }), headers);
        filename = `connections_${new Date().toISOString().split('T')[0]}.csv`;
        break;
      }

      case 'stats': {
        // 統計サマリーをCSVで出力
        const totalUsers = await User.countDocuments();
        const totalEvaluations = await Evaluation.countDocuments();
        const totalSearches = await SearchHistory.countDocuments();
        const totalConnections = await Connection.countDocuments({ status: 'active' });

        const now = new Date();
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const users7Days = await User.countDocuments({ createdAt: { $gte: last7Days } });
        const users30Days = await User.countDocuments({ createdAt: { $gte: last30Days } });
        const evaluations7Days = await Evaluation.countDocuments({ createdAt: { $gte: last7Days } });
        const evaluations30Days = await Evaluation.countDocuments({ createdAt: { $gte: last30Days } });
        const searches7Days = await SearchHistory.countDocuments({ createdAt: { $gte: last7Days } });
        const searches30Days = await SearchHistory.countDocuments({ createdAt: { $gte: last30Days } });

        const statsData = [
          { metric: 'ユーザー総数', value: totalUsers, last7Days: users7Days, last30Days: users30Days },
          { metric: '評価総数', value: totalEvaluations, last7Days: evaluations7Days, last30Days: evaluations30Days },
          { metric: '検索総数', value: totalSearches, last7Days: searches7Days, last30Days: searches30Days },
          { metric: 'つながり総数', value: totalConnections, last7Days: '-', last30Days: '-' },
        ];

        const headers = [
          { key: 'metric', label: '指標' },
          { key: 'value', label: '合計' },
          { key: 'last7Days', label: '過去7日' },
          { key: 'last30Days', label: '過去30日' },
        ];

        csv = toCSV(statsData, headers);
        filename = `stats_${new Date().toISOString().split('T')[0]}.csv`;
        break;
      }

      default:
        return NextResponse.json({ error: '無効なエクスポートタイプです' }, { status: 400 });
    }

    // CSVレスポンスを返す
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Admin export error:', error);
    return NextResponse.json({ error: 'エクスポートに失敗しました' }, { status: 500 });
  }
}
