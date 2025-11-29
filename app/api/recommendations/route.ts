import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/mongodb';
import Evaluation from '@/models/Evaluation';
import Company from '@/models/Company';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    await connectDB();

    const userId = session.user.id;

    // 1. Get user's evaluation history
    const userEvaluations = await Evaluation.find({ userId }).lean();

    if (userEvaluations.length === 0) {
      return NextResponse.json({
        success: true,
        recommendations: [],
        analysis: {
          totalEvaluations: 0,
          preferredIndustries: [],
          averageRating: 0,
          message: 'まだ評価がありません。企業を評価すると、おすすめが表示されます。'
        }
      });
    }

    // 2. Get companies the user has already evaluated
    const evaluatedSlugs = userEvaluations.map(e => e.companySlug);

    // 3. Get company details for evaluated companies to analyze industries
    const evaluatedCompanies = await Company.find({
      slug: { $in: evaluatedSlugs }
    }).lean();

    // 4. Analyze user's preferences
    const industryCount: Record<string, { count: number; totalRating: number }> = {};
    const excludedIndustries = ['情報収集中...', '未分類', ''];

    userEvaluations.forEach(evaluation => {
      const company = evaluatedCompanies.find(c => c.slug === evaluation.companySlug);
      if (company && company.industry && !excludedIndustries.includes(company.industry)) {
        if (!industryCount[company.industry]) {
          industryCount[company.industry] = { count: 0, totalRating: 0 };
        }
        industryCount[company.industry].count++;
        industryCount[company.industry].totalRating += evaluation.rating;
      }
    });

    // Sort industries by frequency and average rating
    const preferredIndustries = Object.entries(industryCount)
      .map(([industry, data]) => ({
        industry,
        count: data.count,
        avgRating: data.totalRating / data.count
      }))
      .sort((a, b) => {
        // Prioritize industries with high ratings and high count
        const scoreA = a.avgRating * 0.6 + (a.count / userEvaluations.length) * 2;
        const scoreB = b.avgRating * 0.6 + (b.count / userEvaluations.length) * 2;
        return scoreB - scoreA;
      })
      .slice(0, 5);

    // 5. Calculate average rating given by user
    const avgUserRating = userEvaluations.reduce((sum, e) => sum + e.rating, 0) / userEvaluations.length;

    // 6. Find recommended companies based on:
    // - Same industries as user's preferred industries
    // - Not already evaluated by user
    // - Has good average rating
    const topIndustries = preferredIndustries.slice(0, 3).map(p => p.industry);

    let recommendations = await Company.find({
      slug: { $nin: evaluatedSlugs },
      industry: { $in: topIndustries.length > 0 ? topIndustries : { $nin: excludedIndustries } },
      averageRating: { $gte: 3 } // Only recommend companies with decent ratings
    })
      .sort({ averageRating: -1, searchCount: -1 })
      .limit(10)
      .lean();

    // If not enough recommendations from preferred industries, add popular companies
    if (recommendations.length < 5) {
      const additionalCompanies = await Company.find({
        slug: { $nin: [...evaluatedSlugs, ...recommendations.map(r => r.slug)] },
        industry: { $nin: excludedIndustries },
        averageRating: { $gte: 3.5 }
      })
        .sort({ searchCount: -1, averageRating: -1 })
        .limit(5 - recommendations.length)
        .lean();

      recommendations = [...recommendations, ...additionalCompanies];
    }

    // 7. Format recommendations
    const formattedRecommendations = recommendations.map(company => ({
      slug: company.slug,
      name: company.name,
      industry: company.industry,
      averageRating: company.averageRating,
      description: company.description?.substring(0, 100) + '...',
      matchReason: topIndustries.includes(company.industry)
        ? `あなたが高評価した${company.industry}業界の企業`
        : '人気の高評価企業'
    }));

    return NextResponse.json({
      success: true,
      recommendations: formattedRecommendations,
      analysis: {
        totalEvaluations: userEvaluations.length,
        preferredIndustries: preferredIndustries.map(p => ({
          name: p.industry,
          count: p.count,
          avgRating: Math.round(p.avgRating * 10) / 10
        })),
        averageRating: Math.round(avgUserRating * 10) / 10,
        message: userEvaluations.length < 3
          ? 'より多くの企業を評価すると、精度の高いおすすめが表示されます。'
          : `${preferredIndustries[0]?.industry || ''}業界への関心が高いようです。`
      }
    });

  } catch (error) {
    console.error('Recommendations API error:', error);
    return NextResponse.json(
      { error: 'おすすめの取得に失敗しました' },
      { status: 500 }
    );
  }
}
