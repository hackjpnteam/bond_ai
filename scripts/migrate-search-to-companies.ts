/**
 * 検索結果を会社コレクションに移行するスクリプト
 * 既存の検索結果から会社の説明文とソースを取得してcompaniesコレクションを更新
 */

import connectDB from '../lib/mongodb';
import SearchResult from '../models/SearchResult';
import Company from '../models/Company';

async function migrateSearchToCompanies() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // 全ての検索結果を取得（会社ごとにグループ化）
    const searchResults = await SearchResult.aggregate([
      {
        $group: {
          _id: '$company',
          latestResult: { $last: '$$ROOT' },
          count: { $sum: 1 }
        }
      }
    ]);

    console.log(`Found ${searchResults.length} unique companies in search results`);

    for (const result of searchResults) {
      const companyName = result._id;
      const latestResult = result.latestResult;
      const companySlug = companyName.toLowerCase();

      console.log(`\nProcessing: ${companyName}`);

      // 既存の会社を検索
      let company = await Company.findOne({
        $or: [
          { slug: companySlug },
          { name: companyName }
        ]
      });

      if (company) {
        // 既存の会社がある場合、以下の条件で更新：
        // 1. 説明文が短いか空
        // 2. 新しいanswerが大幅に長い
        const needsUpdate = !company.description ||
          company.description.length < 50 ||
          company.description === '情報収集中...' ||
          company.description.includes('詳細情報を表示');

        const answerIsSignificantlyLonger = latestResult.answer &&
          latestResult.answer.length > company.description.length * 1.5 &&
          latestResult.answer.length - company.description.length > 200;

        if ((needsUpdate || answerIsSignificantlyLonger) && latestResult.answer) {
          await Company.updateOne(
            { _id: company._id },
            {
              $set: {
                description: latestResult.answer,
                sources: latestResult.metadata?.sources || [],
                lastSearchAt: new Date()
              }
            }
          );
          console.log(`  Updated description for ${companyName} (needsUpdate: ${needsUpdate}, longer: ${answerIsSignificantlyLonger})`);
          console.log(`    Old length: ${company.description?.length || 0}, New length: ${latestResult.answer.length}`);
        } else {
          console.log(`  Skipped ${companyName} - already has sufficient description (${company.description?.length || 0} chars)`);
        }
      } else {
        // 新しい会社を作成
        const facts = latestResult.metadata?.facts || [];
        const newCompany = new Company({
          name: companyName,
          slug: companySlug,
          description: latestResult.answer || '情報収集中...',
          industry: facts.find((f: any) => f.label?.includes('業界'))?.value || '情報収集中...',
          founded: facts.find((f: any) => f.label?.includes('設立'))?.value || '情報収集中',
          employees: facts.find((f: any) => f.label?.includes('従業員'))?.value || '情報収集中',
          website: facts.find((f: any) => f.label?.includes('ウェブサイト'))?.value || '',
          sources: latestResult.metadata?.sources || [],
          searchCount: result.count,
          averageRating: 0,
          dataSource: 'ai_search',
          lastSearchAt: new Date()
        });
        await newCompany.save();
        console.log(`  Created new company: ${companyName}`);
      }
    }

    console.log('\nMigration completed!');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrateSearchToCompanies();
