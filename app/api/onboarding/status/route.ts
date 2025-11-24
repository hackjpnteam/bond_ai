import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

// GET /api/onboarding/status - オンボーディング状態を取得
export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    await connectDB();

    const userId = user.id;
    const dbUser = await User.findById(userId).select('evaluationCount onboardingCompleted');

    if (!dbUser) {
      return new Response(
        JSON.stringify({ error: 'ユーザーが見つかりません' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const evaluationCount = dbUser.evaluationCount || 0;
    const requiredEvaluations = 2;
    // evaluationCountのみを判定基準として使用（フェイルセーフ）
    const onboardingCompleted = evaluationCount >= requiredEvaluations;
    const remainingEvaluations = Math.max(0, requiredEvaluations - evaluationCount);

    return new Response(
      JSON.stringify({
        success: true,
        onboarding: {
          completed: onboardingCompleted,
          evaluationCount,
          requiredEvaluations,
          remainingEvaluations,
          progress: Math.min(100, (evaluationCount / requiredEvaluations) * 100)
        }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Get onboarding status error:', error);
    return new Response(
      JSON.stringify({ error: 'オンボーディング状態の取得に失敗しました' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});
