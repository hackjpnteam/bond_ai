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

/**
 * Vercel Cron Jobs用エンドポイント
 *
 * vercel.jsonに以下を追加:
 * {
 *   "crons": [{
 *     "path": "/api/cron/update-news",
 *     "schedule": "0 3 * * 1"
 *   }]
 * }
 *
 * これにより毎週月曜日の午前3時（UTC）に自動実行されます
 */
export async function GET(request: NextRequest) {
  try {
    // Vercel Cron認証
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // 開発環境または CRON_SECRET が未設定の場合はスキップ
      if (process.env.NODE_ENV === 'production' && process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    await connectDB();

    // 1週間以上ニュースを取得していない企業を取得
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const companies = await Company.find({
      $or: [
        { lastNewsFetchAt: { $lt: oneWeekAgo } },
        { lastNewsFetchAt: { $exists: false } }
      ]
    })
      .sort({ searchCount: -1 })
      .limit(20) // Vercelの実行時間制限を考慮して少なめに
      .select('_id name slug sources lastNewsFetchAt');

    let successCount = 0;
    let totalNewSources = 0;

    for (const company of companies) {
      try {
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
              'techcrunch.com'
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

        const existingSources = company.sources || [];
        const existingUrls = new Set(existingSources.map((s: NewsSource) => s.url));
        const uniqueNewSources = newSources.filter(s => !existingUrls.has(s.url));

        await Company.updateOne(
          { _id: company._id },
          {
            $set: {
              sources: [...uniqueNewSources, ...existingSources],
              lastNewsFetchAt: new Date()
            }
          }
        );

        successCount++;
        totalNewSources += uniqueNewSources.length;

        // API制限を考慮
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (companyError) {
        console.error(`Error for ${company.name}:`, companyError);
      }
    }

    return NextResponse.json({
      success: true,
      message: `${successCount}/${companies.length}社のニュースを更新しました`,
      totalNewSources,
      updatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'ニュース更新に失敗しました' },
      { status: 500 }
    );
  }
}
