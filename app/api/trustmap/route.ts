import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Evaluation from '@/models/Evaluation';
import mongoose from 'mongoose';
import { getRelationshipLabel } from '@/lib/relationship';
import { getCompanyLogoPath } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username') || 'hikarutomura';

    // ユーザーを検索（複数の条件で検索）
    let user = await User.findOne({
      $or: [
        { username: username },
        { email: username },
        { email: 'tomura@hackjpn.com' } // Hikaru Tomuraのメールアドレス
      ]
    }).lean();

    // それでも見つからない場合は最初のユーザーを取得（デモ用）
    if (!user) {
      user = await User.findOne({}).lean();
    }

    if (!user) {
      return NextResponse.json({
        centerUser: { id: '', name: 'Demo User', username: 'demo', image: '', company: 'Bond', role: 'founder', trustScore: 0 },
        connections: [],
        companyRelations: []
      });
    }

    const db = mongoose.connection.db;

    // 接続しているユーザーを取得
    const connections = await db.collection('connections').find({
      users: user._id,
      status: 'active'
    }).toArray();

    // 接続ユーザーのIDを取得
    const connectedUserIds = connections.map(conn => {
      const otherUserId = conn.users.find((id: any) => id.toString() !== user._id.toString());
      return otherUserId;
    }).filter(Boolean);

    // 接続ユーザーの詳細を取得
    const connectedUsers = connectedUserIds.length > 0
      ? await User.find({ _id: { $in: connectedUserIds } }).lean()
      : [];

    // ユーザーの評価を取得（会社との関係）
    const allEvaluations = await Evaluation.find({
      userId: user._id.toString(),
      isAnonymous: { $ne: true }
    })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    // 人物名を除外する関数（会社のみ表示）
    const isCompanyName = (name: string) => {
      if (!name) return false;
      // 会社を示すキーワードが含まれていれば会社
      const companyKeywords = ['株式会社', '有限会社', '合同会社', 'Inc', 'Corp', 'LLC', 'Ltd', 'Co.', '社', 'ベンチャーズ', 'Ventures', 'Capital', 'ファンド', 'グループ', 'ホールディングス'];
      if (companyKeywords.some(keyword => name.includes(keyword))) return true;
      // 短い名前（3文字以下でスペースなし）は人物名の可能性が高い
      if (name.length <= 4 && !name.includes(' ') && /^[ぁ-んァ-ヶー一-龠]+$/.test(name)) return false;
      // 日本人の名前パターン（姓名の間にスペースがない4-6文字の漢字・ひらがな）
      if (/^[ぁ-んァ-ヶー一-龠]{2,3}[ぁ-んァ-ヶー一-龠]{2,3}$/.test(name)) return false;
      return true;
    };

    // 会社のみをフィルタリング（重複を除外）
    const seenCompanies = new Set<string>();
    const evaluations = allEvaluations.filter(e => {
      if (!isCompanyName(e.companyName)) return false;
      const normalizedName = e.companyName.toLowerCase().trim();
      if (seenCompanies.has(normalizedName)) return false;
      seenCompanies.add(normalizedName);
      return true;
    });

    // 信頼スコアを計算（評価した星の合計）
    const userTrustScore = allEvaluations.reduce((sum, e) => sum + e.rating, 0);

    // ノードが重ならないように配置する関数
    const totalConnections = connectedUsers.length;
    const totalCompanies = Math.min(evaluations.length, 12);

    // 企業を下半分の円弧状に配置（重なりを防ぐ）
    const getCompanyPosition = (index: number, total: number) => {
      // 下半分に円弧状に配置（左下から右下へ）
      // CSS座標系ではY軸が下向きなので、90°が下になる
      // 角度: 20° から 160° まで（下半分の広い弧）
      const angleStart = (20 * Math.PI) / 180;  // 20° (右下)
      const angleEnd = (160 * Math.PI) / 180;   // 160° (左下)
      const angle = total > 1
        ? angleStart + (index / (total - 1)) * (angleEnd - angleStart)
        : (90 * Math.PI) / 180; // 1社の場合は真下 (90°)

      const radius = 36;
      const x = 50 + radius * Math.cos(angle);
      const y = 50 + radius * Math.sin(angle);

      return {
        x: Math.max(6, Math.min(94, x)),
        y: Math.max(12, Math.min(92, y))
      };
    };

    // ユーザーを上半分に配置
    const getUserPosition = (index: number, total: number) => {
      // ユーザーは上半分に円弧状に配置
      const angleStart = Math.PI * 0.15; // 少し右から開始
      const angleEnd = Math.PI * 0.85;   // 少し左で終了
      const angle = total > 1
        ? angleStart + (index / (total - 1)) * (angleEnd - angleStart)
        : Math.PI / 2; // 1人の場合は真上

      const radius = 35;
      const x = 50 + radius * Math.cos(Math.PI - angle); // 上半分
      const y = 50 - radius * Math.sin(angle);

      return {
        x: Math.max(10, Math.min(90, x)),
        y: Math.max(12, Math.min(45, y))
      };
    };

    // トラストマップ用のデータを構築
    const trustMapData = {
      centerUser: {
        id: user._id.toString(),
        name: user.name,
        username: user.username,
        image: user.image,
        company: user.company || 'hackjpn',
        role: user.role || 'founder',
        trustScore: userTrustScore
      },
      connections: connectedUsers.map((connUser: any, index: number) => {
        const pos = getUserPosition(index, totalConnections);

        return {
          id: connUser._id.toString(),
          name: connUser.name,
          username: connUser.username,
          company: connUser.company || '',
          role: connUser.role || 'other',
          image: connUser.image,
          x: pos.x,
          y: pos.y,
          trustScore: Math.floor(70 + Math.random() * 25), // 仮のスコア
          relationship: '接続済み'
        };
      }),
      companyRelations: evaluations.slice(0, 12).map((evaluation: any, index: number) => {
        const pos = getCompanyPosition(index, totalCompanies);

        // 会社ロゴのパスを生成（getCompanyLogoPath関数を使用）
        const logoPath = getCompanyLogoPath(evaluation.companyName);

        return {
          id: evaluation._id.toString(),
          name: evaluation.companyName,
          slug: evaluation.companySlug,
          type: 'company',
          logo: logoPath,
          x: pos.x,
          y: pos.y,
          rating: evaluation.rating,
          relationship: getRelationshipLabel(evaluation.relationshipType || 0)
        };
      })
    };

    return NextResponse.json(trustMapData);

  } catch (error) {
    console.error('Error fetching trust map:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
