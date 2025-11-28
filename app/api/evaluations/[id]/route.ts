import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import connectDB from '@/lib/mongodb';
import Evaluation from '@/models/Evaluation';
import Company from '@/models/Company';

// PUT /api/evaluations/[id] - 評価を更新
export const PUT = requireAuth(async (request: NextRequest, user, { params }: { params: Promise<{ id: string }> }) => {
  try {
    await connectDB();

    const { id } = await params;
    const body = await request.json();
    const { rating, comment, categories, reason, relationshipType, isAnonymous } = body;

    // relationshipTypeのバリデーション (0-6)
    if (relationshipType !== undefined) {
      const relType = Number(relationshipType);
      if (isNaN(relType) || relType < 0 || relType > 6) {
        return new Response(
          JSON.stringify({ error: '無効な関係性が指定されました' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // 評価を取得
    const evaluation = await Evaluation.findOne({
      _id: id,
      userId: user.id
    });

    if (!evaluation) {
      return new Response(
        JSON.stringify({ error: '評価が見つかりません' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 編集履歴に追加
    if (!evaluation.editHistory) {
      evaluation.editHistory = [];
    }

    evaluation.editHistory.push({
      previousRating: evaluation.rating,
      previousComment: evaluation.comment || '',
      editedAt: new Date(),
      reason: reason || ''
    });

    // 新しい値を設定
    if (typeof rating === 'number') {
      evaluation.rating = rating;
    }
    if (typeof comment === 'string') {
      evaluation.comment = comment;
    }
    if (categories) {
      evaluation.categories = categories;
    }
    if (relationshipType !== undefined) {
      evaluation.relationshipType = Number(relationshipType);
    }
    if (typeof isAnonymous === 'boolean') {
      evaluation.isAnonymous = isAnonymous;
    }

    await evaluation.save();

    return new Response(
      JSON.stringify({
        success: true,
        message: '評価を更新しました',
        evaluation: {
          id: evaluation._id.toString(),
          rating: evaluation.rating,
          comment: evaluation.comment,
          categories: evaluation.categories,
          relationshipType: evaluation.relationshipType,
          isAnonymous: evaluation.isAnonymous,
          editHistory: evaluation.editHistory,
          updatedAt: evaluation.updatedAt
        }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Update evaluation error:', error);
    return new Response(
      JSON.stringify({ error: '評価の更新に失敗しました' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});

// DELETE /api/evaluations/[id] - 評価を削除（トラストマップの繋がりも削除）
export const DELETE = requireAuth(async (request: NextRequest, user, { params }: { params: Promise<{ id: string }> }) => {
  try {
    await connectDB();

    const { id } = await params;

    // まず評価を取得して企業情報を保持
    const evaluation = await Evaluation.findOne({
      _id: id,
      userId: user.id
    });

    if (!evaluation) {
      return new Response(
        JSON.stringify({ error: '評価が見つかりません' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const companySlug = evaluation.companySlug;

    // 評価を削除
    await Evaluation.deleteOne({ _id: id });

    // この企業への評価がこのユーザーから他にないかチェック
    const remainingEvaluations = await Evaluation.countDocuments({
      userId: user.id,
      companySlug: companySlug
    });

    // 他に評価がない場合、企業のreviewedByからユーザーを削除
    if (remainingEvaluations === 0 && companySlug) {
      await Company.updateOne(
        { slug: companySlug },
        { $pull: { reviewedBy: user.id } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: '評価を削除しました。トラストマップからの繋がりも解除されました。',
        companySlug: companySlug,
        connectionRemoved: remainingEvaluations === 0
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Delete evaluation error:', error);
    return new Response(
      JSON.stringify({ error: '評価の削除に失敗しました' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});
