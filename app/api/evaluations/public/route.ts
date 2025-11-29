import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import Evaluation from '@/models/Evaluation';
import User from '@/models/User';
import UserProfile from '@/models/UserProfile';
import mongoose from 'mongoose';
import { getRelationshipLabel } from '@/lib/relationship';

// GET /api/evaluations/public - 公開用評価一覧を取得（認証不要）
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const companySlug = url.searchParams.get('company');

    if (!companySlug) {
      return new Response(
        JSON.stringify({ error: 'company parameter is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const decodedCompanySlug = decodeURIComponent(companySlug);
    const query = {
      $or: [
        { companySlug: companySlug },
        { companySlug: decodedCompanySlug },
        { companyName: companySlug },
        { companyName: decodedCompanySlug }
      ]
    };

    const evaluations = await Evaluation.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .lean();

    const validUserIds = evaluations
      .map((evaluation) => evaluation.userId)
      .filter((id): id is string => typeof id === 'string' && mongoose.Types.ObjectId.isValid(id));

    const objectIds = Array.from(new Set(validUserIds)).map((id) => new mongoose.Types.ObjectId(id));

    const [users, profiles] = objectIds.length
      ? await Promise.all([
          User.find({ _id: { $in: objectIds } })
            .select('name company role image')
            .lean(),
          UserProfile.find({ userId: { $in: objectIds } })
            .select('userId profileImage')
            .lean()
        ])
      : [[], []];

    const userDetailsMap = new Map<string, { id: string; name?: string; company?: string; role?: string; image?: string }>();

    users.forEach((userDoc) => {
      userDetailsMap.set(userDoc._id.toString(), {
        id: userDoc._id.toString(),
        name: userDoc.name,
        company: userDoc.company,
        role: userDoc.role,
        image: userDoc.image || undefined
      });
    });

    profiles.forEach((profileDoc) => {
      const key = profileDoc.userId.toString();
      const existing = userDetailsMap.get(key) || { id: key };
      userDetailsMap.set(key, {
        ...existing,
        image: profileDoc.profileImage || existing.image
      });
    });

    return new Response(
      JSON.stringify({
        success: true,
        evaluations: evaluations.map(evaluation => {
          const userDetails = evaluation.userId ? userDetailsMap.get(evaluation.userId.toString()) : null;
          const relationshipType = evaluation.relationshipType ?? 0;
          const likes = evaluation.likes || [];
          const replies = evaluation.replies || [];

          return {
            id: evaluation._id.toString(),
            companyName: evaluation.companyName,
            companySlug: evaluation.companySlug,
            rating: evaluation.rating,
            relationshipType: relationshipType,
            relationshipLabel: getRelationshipLabel(relationshipType),
            comment: evaluation.comment,
            categories: evaluation.categories,
            isAnonymous: evaluation.isAnonymous,
            createdAt: evaluation.createdAt,
            updatedAt: evaluation.updatedAt,
            userId: evaluation.userId,
            user: userDetails,
            likesCount: likes.length,
            hasLiked: false,
            repliesCount: replies.length,
            replies: []
          };
        })
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Get public evaluations error:', error);
    return new Response(
      JSON.stringify({ error: '評価データの取得に失敗しました' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
