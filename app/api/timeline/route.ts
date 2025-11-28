import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/mongodb';
import Evaluation from '@/models/Evaluation';
import User from '@/models/User';
import { getRelationshipLabel } from '@/lib/relationship';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    // 公開されている評価データを取得
    const evaluations = await Evaluation.find({
      $or: [
        { isPublic: true },
        { isPublic: { $exists: false } }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // 評価者のユーザーIDを収集
    const userIds = [
      ...new Set(
        evaluations
          .map(evaluation => evaluation.userId)
          .filter((id): id is string => typeof id === 'string' && id.length > 0)
      )
    ];

    // リプライのユーザーIDも収集
    const replyUserIds = evaluations.flatMap(evaluation =>
      (evaluation.replies || [])
        .filter((r: any) => !r.isAnonymous)
        .map((r: any) => r.userId)
    );

    const allUserIds = [...new Set([...userIds, ...replyUserIds])];

    const users = allUserIds.length
      ? await User.find({ _id: { $in: allUserIds } })
          .select('name image')
          .lean()
      : [];

    const userMap = new Map(
      users.map(user => [user._id.toString(), { _id: user._id.toString(), name: user.name, image: user.image }])
    );

    // タイムライン用にデータを整形
    const timelineData = evaluations.map(evaluation => {
      const matchedUser =
        (typeof evaluation.userId === 'object' && 'name' in evaluation.userId)
          ? evaluation.userId
          : userMap.get(evaluation.userId?.toString() || '');

      const relationshipType = evaluation.relationshipType ?? 0;
      const likes = evaluation.likes || [];
      const replies = evaluation.replies || [];

      // リプライにユーザー情報を付加
      const repliesWithUsers = replies.map((reply: any) => ({
        userId: reply.userId,
        content: reply.content,
        isAnonymous: reply.isAnonymous,
        createdAt: reply.createdAt,
        user: reply.isAnonymous ? null : userMap.get(reply.userId) || null
      }));

      return {
        _id: evaluation._id.toString(),
        rating: evaluation.rating,
        comment: evaluation.comment,
        relationshipType: relationshipType,
        relationshipLabel: getRelationshipLabel(relationshipType),
        createdAt: evaluation.createdAt,
        user: {
          name: matchedUser?.name || 'Anonymous User',
          image: matchedUser?.image || '/default-avatar.png'
        },
        company: {
          _id: evaluation.companySlug,
          name: evaluation.companyName,
          slug: evaluation.companySlug,
          logoUrl: '/default-company.png'
        },
        isAnonymous: evaluation.isAnonymous || false,
        likesCount: likes.length,
        hasLiked: currentUserId ? likes.includes(currentUserId) : false,
        repliesCount: replies.length,
        replies: repliesWithUsers
      };
    });

    return NextResponse.json(timelineData);

  } catch (error) {
    console.error('Timeline error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch timeline' },
      { status: 500 }
    );
  }
}
