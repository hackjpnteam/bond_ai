import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import connectDB from '@/lib/mongodb';
import SearchResult from '@/models/SearchResult';
import Company from '@/models/Company';

// GET /api/search-results - 検索結果を取得
export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    await connectDB();
    
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const company = url.searchParams.get('company');
    
    let query: any = { userId: user.id };
    if (company) {
      query.company = { $regex: company, $options: 'i' };
    }
    
    const searchResults = await SearchResult.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .lean();
    
    return new Response(
      JSON.stringify({
        success: true,
        searchResults: searchResults.map(result => ({
          id: result._id.toString(),
          query: result.query,
          company: result.company,
          answer: result.answer,
          metadata: result.metadata,
          createdAt: result.createdAt
        }))
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('Get search results error:', error);
    return new Response(
      JSON.stringify({ error: '検索結果の取得に失敗しました' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});

// POST /api/search-results - 検索結果を保存
export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    await connectDB();
    
    const body = await request.json();
    const { query, company, answer, metadata } = body;
    
    if (!query || !company || !answer) {
      return new Response(
        JSON.stringify({ error: '必須項目を入力してください' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // 新しい検索結果を作成
    const searchResult = new SearchResult({
      userId: user.id,
      query: query.trim(),
      company: company.trim(),
      answer,
      metadata: metadata || {}
    });

    await searchResult.save();

    // 会社コレクションにも保存/更新（全ユーザーが閲覧可能にする）
    const companySlug = company.trim().toLowerCase();
    try {
      const existingCompany = await Company.findOne({
        $or: [
          { slug: companySlug },
          { name: company.trim() }
        ]
      });

      if (existingCompany) {
        // 既存の会社がある場合、以下の条件で更新：
        // 1. プレースホルダー（短い説明文や「情報収集中」）
        // 2. 新しいanswerが既存より大幅に長い（2倍以上かつ500文字以上長い）
        const isPlaceholder = !existingCompany.description ||
          existingCompany.description === '情報収集中...' ||
          existingCompany.description.length < 50;

        const answerIsSignificantlyLonger = answer.length > existingCompany.description.length * 2 &&
          answer.length - existingCompany.description.length > 500;

        if (isPlaceholder || answerIsSignificantlyLonger) {
          await Company.updateOne(
            { _id: existingCompany._id },
            {
              $set: {
                description: answer,
                sources: metadata?.sources || [],
                lastSearchAt: new Date()
              },
              $inc: { searchCount: 1 }
            }
          );
          console.log(`Updated company description for: ${company.trim()} (placeholder: ${isPlaceholder}, longer: ${answerIsSignificantlyLonger})`);
        } else {
          // 検索回数だけ更新
          await Company.updateOne(
            { _id: existingCompany._id },
            {
              $inc: { searchCount: 1 },
              $set: { lastSearchAt: new Date() }
            }
          );
        }
      } else {
        // 新しい会社を作成
        const newCompany = new Company({
          name: company.trim(),
          slug: companySlug,
          description: answer,
          industry: metadata?.facts?.find((f: any) => f.label?.includes('業界'))?.value || '情報収集中...',
          founded: metadata?.facts?.find((f: any) => f.label?.includes('設立'))?.value || '情報収集中',
          employees: metadata?.facts?.find((f: any) => f.label?.includes('従業員'))?.value || '情報収集中',
          website: metadata?.facts?.find((f: any) => f.label?.includes('ウェブサイト'))?.value || '',
          sources: metadata?.sources || [],
          searchCount: 1,
          averageRating: 0,
          dataSource: 'ai_search',
          lastSearchAt: new Date()
        });
        await newCompany.save();
        console.log(`Created new company: ${company.trim()}`);
      }
    } catch (companyError) {
      console.error('Error updating company:', companyError);
      // 会社更新エラーは無視して続行
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: '検索結果を保存しました',
        searchResult: {
          id: searchResult._id.toString(),
          query: searchResult.query,
          company: searchResult.company,
          answer: searchResult.answer,
          metadata: searchResult.metadata,
          createdAt: searchResult.createdAt
        }
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('Save search result error:', error);
    return new Response(
      JSON.stringify({ error: '検索結果の保存に失敗しました' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});