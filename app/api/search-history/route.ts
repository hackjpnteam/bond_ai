import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import connectDB from '@/lib/mongodb';
import SearchHistory from '@/models/SearchHistory';

// GET /api/search-history - 検索履歴を取得
export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    await connectDB();
    
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    const searchHistory = await SearchHistory.find({ userId: user.id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .lean();
    
    return new Response(
      JSON.stringify({
        success: true,
        searchHistory: searchHistory.map(search => ({
          id: search._id.toString(),
          query: search.query,
          mode: search.mode,
          results: search.results,
          createdAt: search.createdAt,
          date: search.createdAt.toLocaleDateString('ja-JP')
        }))
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('Get search history error:', error);
    return new Response(
      JSON.stringify({ error: '検索履歴の取得に失敗しました' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});

// POST /api/search-history - 検索履歴を保存
export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    await connectDB();
    
    const body = await request.json();
    const { query, mode, results } = body;
    
    if (!query || !mode) {
      return new Response(
        JSON.stringify({ error: '必須項目を入力してください' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // 重複チェック - 同じクエリが最近にあれば更新、なければ新規作成
    const recentSearch = await SearchHistory.findOne({
      userId: user.id,
      query: query.trim(),
      mode,
      createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // 1時間以内
    });
    
    if (recentSearch) {
      // 既存の検索を更新
      recentSearch.results = results;
      await recentSearch.save();
      
      return new Response(
        JSON.stringify({
          success: true,
          message: '検索履歴を更新しました',
          searchHistory: {
            id: recentSearch._id.toString(),
            query: recentSearch.query,
            mode: recentSearch.mode,
            results: recentSearch.results,
            createdAt: recentSearch.createdAt
          }
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } else {
      // 新しい検索履歴を作成
      const searchHistory = new SearchHistory({
        userId: user.id,
        query: query.trim(),
        mode,
        results
      });
      
      await searchHistory.save();
      
      return new Response(
        JSON.stringify({
          success: true,
          message: '検索履歴を保存しました',
          searchHistory: {
            id: searchHistory._id.toString(),
            query: searchHistory.query,
            mode: searchHistory.mode,
            results: searchHistory.results,
            createdAt: searchHistory.createdAt
          }
        }),
        {
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
  } catch (error) {
    console.error('Save search history error:', error);
    return new Response(
      JSON.stringify({ error: '検索履歴の保存に失敗しました' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});