import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Company from '@/models/Company';
import { tavily } from '@tavily/core';

const tavilyClient = new tavily({ apiKey: process.env.TAVILY_API_KEY || '' });

interface NewsSource {
  url: string;
  title?: string;
  published_at?: string;
  fetched_at?: Date;
}

// POST /api/companies/[slug]/news - 企業の最新ニュースを取得して更新
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();

    const { slug } = await params;
    const decodedSlug = decodeURIComponent(slug);

    // 企業を検索
    const company = await Company.findOne({
      $or: [
        { slug: decodedSlug.toLowerCase() },
        { name: { $regex: new RegExp(`^${decodedSlug}$`, 'i') } }
      ]
    });

    if (!company) {
      return NextResponse.json(
        { error: '企業が見つかりません' },
        { status: 404 }
      );
    }

    // 最後のニュース取得から1週間以内の場合はスキップ（強制更新でない限り）
    const body = await request.json().catch(() => ({}));
    const forceUpdate = body.force === true;

    if (!forceUpdate && company.lastNewsFetchAt) {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      if (company.lastNewsFetchAt > oneWeekAgo) {
        return NextResponse.json({
          success: true,
          message: '最新のニュースは既に取得済みです',
          lastFetchAt: company.lastNewsFetchAt,
          sourcesCount: company.sources?.length || 0
        });
      }
    }

    // Tavilyで最新ニュースを検索
    // 検索クエリは会社名のみでシンプルに（site: は不要、includeDomainsで指定済み）
    const searchQuery = `${company.name} ニュース`;
    console.log(`[News] Searching for: "${company.name}" (slug: ${company.slug})`);
    console.log(`[News] Search query: ${searchQuery}`);

    let newSources: NewsSource[] = [];

    try {
      const searchResult = await tavilyClient.search(searchQuery, {
        searchDepth: 'basic',
        maxResults: 10,
        includeAnswer: false,
        includeDomains: [
          'prtimes.jp',
          'news.yahoo.co.jp',
          'nikkei.com',
          'itmedia.co.jp',
          'techcrunch.com',
          'jp.techcrunch.com',
          'businessinsider.jp',
          'forbesjapan.com',
          'diamond.jp',
          'toyokeizai.net',
          'bridge.jp',
          'thebridge.jp'
        ]
      });

      console.log(`[News] Search results count: ${searchResult.results?.length || 0}`);

      if (searchResult.results && searchResult.results.length > 0) {
        newSources = searchResult.results.map((result: any) => ({
          url: result.url,
          title: result.title,
          published_at: result.publishedDate || undefined,
          fetched_at: new Date()
        }));
        console.log(`[News] Found sources:`, newSources.map(s => s.title));
      }
    } catch (searchError) {
      console.error('Tavily search error:', searchError);
      // 検索エラーでも続行（既存のソースは保持）
    }

    // 既存のソースと新しいソースをマージ（重複を除去）
    const existingSources = company.sources || [];
    const existingUrls = new Set(existingSources.map((s: NewsSource) => s.url));

    const uniqueNewSources = newSources.filter(s => !existingUrls.has(s.url));

    // 新しいソースを先頭に追加（最新順）
    const mergedSources = [...uniqueNewSources, ...existingSources];

    // 更新（findOneAndUpdateでバリデーションをスキップ）
    const now = new Date();
    await Company.findByIdAndUpdate(
      company._id,
      {
        $set: {
          sources: mergedSources,
          lastNewsFetchAt: now
        }
      },
      { runValidators: false }
    );

    return NextResponse.json({
      success: true,
      message: `${uniqueNewSources.length}件の新しいソースを追加しました`,
      newSourcesCount: uniqueNewSources.length,
      totalSourcesCount: mergedSources.length,
      lastFetchAt: now
    });

  } catch (error) {
    console.error('News fetch error:', error);
    return NextResponse.json(
      { error: 'ニュースの取得に失敗しました' },
      { status: 500 }
    );
  }
}

// GET /api/companies/[slug]/news - 企業のニュースソース一覧を取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();

    const { slug } = await params;
    const decodedSlug = decodeURIComponent(slug);

    const company = await Company.findOne({
      $or: [
        { slug: decodedSlug.toLowerCase() },
        { name: { $regex: new RegExp(`^${decodedSlug}$`, 'i') } }
      ]
    }).select('name sources lastNewsFetchAt');

    if (!company) {
      return NextResponse.json(
        { error: '企業が見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      companyName: company.name,
      sources: company.sources || [],
      lastNewsFetchAt: company.lastNewsFetchAt
    });

  } catch (error) {
    console.error('Get news error:', error);
    return NextResponse.json(
      { error: 'ニュースの取得に失敗しました' },
      { status: 500 }
    );
  }
}
