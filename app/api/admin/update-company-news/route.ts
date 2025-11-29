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

// POST /api/admin/update-company-news - 全企業または指定企業の最新ニュースを取得
export async function POST(request: NextRequest) {
  try {
    // 管理者認証（簡易的にAPIキーで認証）
    const authHeader = request.headers.get('authorization');
    const adminKey = process.env.ADMIN_API_KEY;

    if (adminKey && authHeader !== `Bearer ${adminKey}`) {
      return NextResponse.json(
        { error: '認証エラー' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json().catch(() => ({}));
    const { companyIds, force = false, limit = 50 } = body;

    // 更新対象の企業を取得
    let query: any = {};

    if (companyIds && Array.isArray(companyIds) && companyIds.length > 0) {
      // 指定された企業のみ
      query._id = { $in: companyIds };
    } else if (!force) {
      // 1週間以上ニュースを取得していない企業のみ
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      query.$or = [
        { lastNewsFetchAt: { $lt: oneWeekAgo } },
        { lastNewsFetchAt: { $exists: false } }
      ];
    }

    // searchCountが多い順（よく検索される企業から優先）
    const companies = await Company.find(query)
      .sort({ searchCount: -1 })
      .limit(limit)
      .select('_id name slug sources lastNewsFetchAt');

    const results: Array<{
      companyId: string;
      companyName: string;
      success: boolean;
      newSourcesCount?: number;
      error?: string;
    }> = [];

    for (const company of companies) {
      try {
        // Tavilyで最新ニュースを検索
        const searchQuery = `${company.name} プレスリリース OR ニュース OR 発表`;

        let newSources: NewsSource[] = [];

        try {
          const searchResult = await tavilyClient.search(searchQuery, {
            searchDepth: 'basic',
            maxResults: 5,
            includeAnswer: false,
            includeDomains: [
              'prtimes.jp',
              'news.yahoo.co.jp',
              'nikkei.com',
              'itmedia.co.jp',
              'techcrunch.com',
              'jp.techcrunch.com',
              'businessinsider.jp',
              'forbesjapan.com'
            ]
          });

          if (searchResult.results && searchResult.results.length > 0) {
            newSources = searchResult.results.map((result: any) => ({
              url: result.url,
              title: result.title,
              published_at: result.publishedDate || undefined,
              fetched_at: new Date()
            }));
          }
        } catch (searchError) {
          console.error(`Search error for ${company.name}:`, searchError);
        }

        // 既存のソースと新しいソースをマージ
        const existingSources = company.sources || [];
        const existingUrls = new Set(existingSources.map((s: NewsSource) => s.url));
        const uniqueNewSources = newSources.filter(s => !existingUrls.has(s.url));

        // 更新
        await Company.updateOne(
          { _id: company._id },
          {
            $set: {
              sources: [...uniqueNewSources, ...existingSources],
              lastNewsFetchAt: new Date()
            }
          }
        );

        results.push({
          companyId: company._id.toString(),
          companyName: company.name,
          success: true,
          newSourcesCount: uniqueNewSources.length
        });

        // API制限を考慮して少し待機
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (companyError) {
        console.error(`Error updating news for ${company.name}:`, companyError);
        results.push({
          companyId: company._id.toString(),
          companyName: company.name,
          success: false,
          error: companyError instanceof Error ? companyError.message : 'Unknown error'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const totalNewSources = results.reduce((sum, r) => sum + (r.newSourcesCount || 0), 0);

    return NextResponse.json({
      success: true,
      message: `${successCount}/${companies.length}社のニュースを更新しました`,
      totalNewSources,
      results
    });

  } catch (error) {
    console.error('Batch news update error:', error);
    return NextResponse.json(
      { error: 'ニュースの一括更新に失敗しました' },
      { status: 500 }
    );
  }
}
