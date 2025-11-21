import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Evaluation from '@/models/Evaluation';
import User from '@/models/User';
import { getRelationshipLabel } from '@/lib/relationship';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

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

    const userIds = [
      ...new Set(
        evaluations
          .map(evaluation => evaluation.userId)
          .filter((id): id is string => typeof id === 'string' && id.length > 0)
      )
    ];

    const users = userIds.length
      ? await User.find({ _id: { $in: userIds } })
          .select('name image')
          .lean()
      : [];

    const userMap = new Map(
      users.map(user => [user._id.toString(), { name: user.name, image: user.image }])
    );

    // タイムライン用にデータを整形
    const timelineData = evaluations.map(evaluation => {
      const matchedUser =
        (typeof evaluation.userId === 'object' && 'name' in evaluation.userId)
          ? evaluation.userId
          : userMap.get(evaluation.userId?.toString() || '');

      const relationshipType = evaluation.relationshipType ?? 0;

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
        isAnonymous: evaluation.isAnonymous || false
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
