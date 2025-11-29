/**
 * 企業ニュース定期更新スクリプト
 *
 * 使用方法:
 * npx tsx scripts/update-company-news.ts
 *
 * cron設定例（毎週月曜日の午前3時に実行）:
 * 0 3 * * 1 cd /path/to/bond && npx tsx scripts/update-company-news.ts >> /var/log/bond-news-update.log 2>&1
 *
 * または Vercel Cron Jobs で設定:
 * vercel.json の crons に追加
 */

import mongoose from 'mongoose';
import { tavily } from '@tavily/core';
import dotenv from 'dotenv';

// 環境変数を読み込み
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || '';
const TAVILY_API_KEY = process.env.TAVILY_API_KEY || '';

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined');
  process.exit(1);
}

if (!TAVILY_API_KEY) {
  console.error('TAVILY_API_KEY is not defined');
  process.exit(1);
}

const tavilyClient = new tavily({ apiKey: TAVILY_API_KEY });

interface NewsSource {
  url: string;
  title?: string;
  published_at?: string;
  fetched_at?: Date;
}

// Company スキーマを直接定義
const CompanySchema = new mongoose.Schema({
  name: String,
  slug: String,
  sources: [{
    url: String,
    title: String,
    published_at: String,
    fetched_at: Date
  }],
  lastNewsFetchAt: Date,
  searchCount: Number
}, { collection: 'companies' });

async function updateCompanyNews() {
  console.log('='.repeat(50));
  console.log(`企業ニュース更新開始: ${new Date().toISOString()}`);
  console.log('='.repeat(50));

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB接続成功');

    const Company = mongoose.models.Company || mongoose.model('Company', CompanySchema);

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
      .limit(50)
      .select('_id name slug sources lastNewsFetchAt');

    console.log(`更新対象企業数: ${companies.length}`);

    let successCount = 0;
    let totalNewSources = 0;

    for (const company of companies) {
      try {
        console.log(`\n処理中: ${company.name}`);

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
          console.error(`  検索エラー: ${searchError}`);
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

        console.log(`  完了: ${uniqueNewSources.length}件の新しいソースを追加`);
        successCount++;
        totalNewSources += uniqueNewSources.length;

        // API制限を考慮して待機
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (companyError) {
        console.error(`  エラー: ${companyError}`);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('処理完了');
    console.log(`成功: ${successCount}/${companies.length}社`);
    console.log(`追加されたニュース: ${totalNewSources}件`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('エラー:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB切断');
  }
}

// 実行
updateCompanyNews();
