import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import connectDB from '@/lib/mongodb';
import SearchResult from '@/models/SearchResult';

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