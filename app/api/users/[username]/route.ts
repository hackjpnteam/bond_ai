import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Evaluation from '@/models/Evaluation';
import { getRelationshipLabel } from '@/lib/relationship';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    await connectDB();

    const { username } = await params;

    // ユーザーを検索（usernameまたはemailで完全一致）
    // NOTE: nameでの検索は削除 - 名前の重複で別ユーザーがヒットする問題があった
    const user = await User.findOne({
      $or: [
        { username: username },
        { email: username }
      ]
    }).lean();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'ユーザーが見つかりません',
          user: null
        },
        { status: 404 }
      );
    }

    // ユーザーの評価を取得
    const evaluations = await Evaluation.find({
      userId: user._id.toString()
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    // 企業別にグループ化して関係性情報を構築
    const companyRelationships = evaluations.map(evaluation => {
      const relationshipType = evaluation.relationshipType ?? 0;

      return {
        companyName: evaluation.companyName,
        companySlug: evaluation.companySlug,
        rating: evaluation.rating,
        comment: evaluation.comment,
        relationshipType: relationshipType,
        relationshipLabel: getRelationshipLabel(relationshipType),
        relationshipSource: 'evaluation',
        createdAt: evaluation.createdAt,
        updatedAt: evaluation.updatedAt
      };
    });

    // バッジを生成
    const achievements = [];
    const reviewCount = evaluations.length;
    const avgRating = reviewCount > 0
      ? evaluations.reduce((sum, e) => sum + e.rating, 0) / reviewCount
      : 0;

    // メンバーバッジ（全員）
    achievements.push({
      id: 'member',
      title: 'Bondメンバー',
      description: 'Bond Launchコミュニティに参加しました',
      earnedDate: user.createdAt,
      badge: '🎯',
      category: 'membership'
    });

    // 評価バッジ
    if (reviewCount >= 1) {
      achievements.push({
        id: 'first-review',
        title: '初めての評価',
        description: '最初の企業評価を投稿しました',
        earnedDate: evaluations[evaluations.length - 1].createdAt,
        badge: '⭐',
        category: 'review'
      });
    }

    if (reviewCount >= 5) {
      achievements.push({
        id: 'active-reviewer',
        title: 'アクティブレビュアー',
        description: '5つ以上の企業を評価しました',
        earnedDate: evaluations[4].createdAt,
        badge: '🌟',
        category: 'review'
      });
    }

    if (reviewCount >= 10) {
      achievements.push({
        id: 'expert-reviewer',
        title: 'エキスパートレビュアー',
        description: '10以上の企業を評価しました',
        earnedDate: evaluations[9].createdAt,
        badge: '💫',
        category: 'review'
      });
    }

    if (reviewCount >= 20) {
      achievements.push({
        id: 'master-reviewer',
        title: 'マスターレビュアー',
        description: '20以上の企業を評価しました',
        earnedDate: evaluations[19].createdAt,
        badge: '✨',
        category: 'review'
      });
    }

    // 高評価者バッジ
    if (avgRating >= 4.5 && reviewCount >= 5) {
      achievements.push({
        id: 'positive-reviewer',
        title: 'ポジティブレビュアー',
        description: '平均評価4.5以上を維持しています',
        earnedDate: evaluations[4].createdAt,
        badge: '😊',
        category: 'quality'
      });
    }

    // 投資家バッジ
    const investorEvaluations = evaluations.filter(e => e.relationshipType === 4);
    if (investorEvaluations.length >= 3) {
      achievements.push({
        id: 'investor',
        title: '投資家',
        description: '3社以上に投資しています',
        earnedDate: investorEvaluations[2].createdAt,
        badge: '💰',
        category: 'relationship'
      });
    }

    // アーリーアダプターバッジ（登録から1ヶ月以内に5件以上評価）
    const oneMonthAfterJoin = new Date(user.createdAt);
    oneMonthAfterJoin.setMonth(oneMonthAfterJoin.getMonth() + 1);
    const earlyReviews = evaluations.filter(e => new Date(e.createdAt) <= oneMonthAfterJoin);
    if (earlyReviews.length >= 5) {
      achievements.push({
        id: 'early-adopter',
        title: 'アーリーアダプター',
        description: '登録から1ヶ月以内に5件の評価を投稿しました',
        earnedDate: earlyReviews[4].createdAt,
        badge: '🚀',
        category: 'special'
      });
    }

    // コネクション数バッジ
    const db = (await connectDB()).connection.db;
    const connections = await db.collection('connections').find({
      users: user._id,
      status: 'active'
    }).toArray();

    const connectionCount = connections.length;

    if (connectionCount >= 10) {
      const tenthConnection = connections.sort((a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )[9];
      achievements.push({
        id: 'connector',
        title: 'コネクター',
        description: '10人以上のユーザーとつながりました',
        earnedDate: tenthConnection.createdAt,
        badge: '🤝',
        category: 'network'
      });
    }

    if (connectionCount >= 25) {
      const connection25th = connections.sort((a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )[24];
      achievements.push({
        id: 'networker',
        title: 'ネットワーカー',
        description: '25人以上のユーザーとつながりました',
        earnedDate: connection25th.createdAt,
        badge: '🌐',
        category: 'network'
      });
    }

    if (connectionCount >= 50) {
      const connection50th = connections.sort((a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )[49];
      achievements.push({
        id: 'super-connector',
        title: 'スーパーコネクター',
        description: '50人以上のユーザーとつながりました',
        earnedDate: connection50th.createdAt,
        badge: '⭐',
        category: 'network'
      });
    }

    if (connectionCount >= 100) {
      const connection100th = connections.sort((a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )[99];
      achievements.push({
        id: 'mega-connector',
        title: 'メガコネクター',
        description: '100人以上のユーザーとつながりました',
        earnedDate: connection100th.createdAt,
        badge: '👑',
        category: 'network'
      });
    }

    // 最近の活動を生成
    const recentActivity = [];

    // 評価活動を追加
    evaluations.slice(0, 10).forEach(evaluation => {
      recentActivity.push({
        id: `review-${evaluation._id.toString()}`,
        type: 'review',
        description: `${evaluation.companyName}を評価しました`,
        companyName: evaluation.companyName,
        companySlug: evaluation.companySlug,
        rating: evaluation.rating,
        date: evaluation.createdAt
      });
    });

    // バッジ獲得活動を追加
    achievements.forEach(achievement => {
      if (achievement.id !== 'member') { // メンバーバッジは除外（初期バッジのため）
        recentActivity.push({
          id: `badge-${achievement.id}`,
          type: 'badge',
          description: `「${achievement.title}」バッジを獲得しました`,
          badge: achievement.badge,
          date: achievement.earnedDate
        });
      }
    });

    // 日付順にソート（新しい順）
    recentActivity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // 最新10件に制限
    const limitedActivity = recentActivity.slice(0, 10);

    // 信頼スコアを計算（評価した星の合計）
    const trustScore = reviewCount > 0
      ? evaluations.reduce((sum, e) => sum + e.rating, 0)
      : 0;

    // ユーザー情報を返す
    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        username: user.username,
        name: user.name,
        email: user.email,
        image: user.image,
        company: user.company,
        role: user.role,
        bio: user.bio,
        interests: user.interests || [],
        skills: user.skills || [],
        createdAt: user.createdAt,
        trustScore: trustScore,
        connectionCount: connectionCount,
        reviewCount: reviewCount,
        companyRelationships: companyRelationships,
        achievements: achievements,
        recentActivity: limitedActivity
      }
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'ユーザー情報の取得に失敗しました',
        user: null
      },
      { status: 500 }
    );
  }
}
