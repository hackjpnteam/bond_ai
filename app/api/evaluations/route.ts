import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import connectDB from '@/lib/mongodb';
import Evaluation from '@/models/Evaluation';
import User from '@/models/User';
import UserProfile from '@/models/UserProfile';
import mongoose from 'mongoose';
import { getRelationshipLabel } from '@/lib/relationship';

// GET /api/evaluations - ユーザーの評価一覧を取得
export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    await connectDB();

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const companySlug = url.searchParams.get('company');

    const userId = user.id;

    const query: Record<string, unknown> = {};
    if (companySlug) {
      const decodedCompanySlug = decodeURIComponent(companySlug);
      query.$or = [
        { companySlug: companySlug },
        { companySlug: decodedCompanySlug },
        { companyName: companySlug },
        { companyName: decodedCompanySlug }
      ];
    } else {
      query.userId = userId;
    }

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

          return {
            id: evaluation._id.toString(),
            companyName: evaluation.companyName,
            companySlug: evaluation.companySlug,
            rating: evaluation.rating,
            relationshipType: relationshipType,
            relationshipLabel: getRelationshipLabel(relationshipType),
            comment: evaluation.comment,
            categories: evaluation.categories,
            editHistory: evaluation.editHistory,
            isAnonymous: evaluation.isAnonymous,
            createdAt: evaluation.createdAt,
            updatedAt: evaluation.updatedAt,
            userId: evaluation.userId,
            user: userDetails
          };
        })
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Get evaluations error:', error);
    return new Response(
      JSON.stringify({ error: '評価データの取得に失敗しました' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});

// POST /api/evaluations - 新しい評価を作成
export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    await connectDB();

    const body = await request.json();
    const { companyName, companySlug, rating, comment, categories, isAnonymous, relationshipType } = body;

    // バリデーション
    if (!companyName || !companySlug || !rating || !comment || !categories) {
      return new Response(
        JSON.stringify({ error: '必須項目を入力してください' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (relationshipType === null || relationshipType === undefined) {
      return new Response(
        JSON.stringify({ error: '関係性を選択してください' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const relationshipTypeNum = Number(relationshipType);
    if (isNaN(relationshipTypeNum) || relationshipTypeNum < 0 || relationshipTypeNum > 4) {
      return new Response(
        JSON.stringify({ error: '関係性の値が不正です' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const userId = user.id;

    // 既存の評価をチェック
    const existingEvaluation = await Evaluation.findOne({
      userId,
      companySlug
    });

    if (existingEvaluation) {
      return new Response(
        JSON.stringify({ error: 'この企業は既に評価済みです' }),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 新しい評価を作成
    const evaluation = new Evaluation({
      userId,
      companyName,
      companySlug,
      rating,
      comment,
      categories,
      relationshipType: relationshipTypeNum,
      isPublic: true,
      isAnonymous: isAnonymous || false
    });

    await evaluation.save();

    return new Response(
      JSON.stringify({
        success: true,
        message: '評価を投稿しました',
        evaluation: {
          id: evaluation._id.toString(),
          companyName: evaluation.companyName,
          companySlug: evaluation.companySlug,
          rating: evaluation.rating,
          relationshipType: evaluation.relationshipType,
          relationshipLabel: getRelationshipLabel(evaluation.relationshipType),
          comment: evaluation.comment,
          categories: evaluation.categories,
          isAnonymous: evaluation.isAnonymous,
          createdAt: evaluation.createdAt
        }
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Create evaluation error:', error);
    return new Response(
      JSON.stringify({ error: '評価の投稿に失敗しました' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});
