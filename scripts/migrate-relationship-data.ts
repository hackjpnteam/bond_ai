/**
 * データベース移行スクリプト
 *
 * 旧システムの relationship (string) を新システムの relationshipType (number) に変換
 *
 * 実行方法: npx tsx scripts/migrate-relationship-data.ts
 */

import mongoose from 'mongoose';
import connectDB from '../lib/mongodb';

// 旧データの関係性マッピング
const LEGACY_TO_NEW_MAPPING: Record<string, number> = {
  'shareholder': 4,  // 投資家
  'executive': 3,    // 協業先
  'employee': 2,     // 取引先
  'partner': 3,      // 協業先
  'customer': 2,     // 取引先
  'other': 0         // 未設定
};

async function migrateRelationshipData() {
  try {
    console.log('🚀 データベース移行を開始します...\n');

    await connectDB();
    console.log('✅ MongoDBに接続しました\n');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    const evaluationsCollection = db.collection('evaluations');

    // 1. 既存データの確認
    const totalDocs = await evaluationsCollection.countDocuments();
    console.log(`📊 全評価数: ${totalDocs}`);

    const oldFormatDocs = await evaluationsCollection.countDocuments({
      relationship: { $exists: true }
    });
    console.log(`🔄 旧フォーマット: ${oldFormatDocs}`);

    const newFormatDocs = await evaluationsCollection.countDocuments({
      relationshipType: { $exists: true }
    });
    console.log(`✨ 新フォーマット: ${newFormatDocs}\n`);

    if (oldFormatDocs === 0) {
      console.log('✅ 移行が必要なデータはありません');
      process.exit(0);
    }

    // 2. 旧データの分布を表示
    console.log('📈 旧データの関係性分布:');
    const distribution = await evaluationsCollection.aggregate([
      { $match: { relationship: { $exists: true } } },
      { $group: { _id: '$relationship', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();

    distribution.forEach(item => {
      const newValue = LEGACY_TO_NEW_MAPPING[item._id as string] ?? 0;
      console.log(`  ${item._id}: ${item.count}件 → relationshipType: ${newValue}`);
    });
    console.log();

    // 3. 移行を実行
    console.log('🔄 データ移行を開始します...\n');

    let migratedCount = 0;
    let errorCount = 0;

    for (const [oldValue, newValue] of Object.entries(LEGACY_TO_NEW_MAPPING)) {
      try {
        const result = await evaluationsCollection.updateMany(
          {
            relationship: oldValue,
            relationshipType: { $exists: false }  // まだ移行していないもののみ
          },
          {
            $set: { relationshipType: newValue }
          }
        );

        if (result.modifiedCount > 0) {
          console.log(`  ✅ ${oldValue} → ${newValue}: ${result.modifiedCount}件を更新`);
          migratedCount += result.modifiedCount;
        }
      } catch (error) {
        console.error(`  ❌ ${oldValue} の移行でエラー:`, error);
        errorCount++;
      }
    }

    // 4. 結果サマリー
    console.log('\n📊 移行結果:');
    console.log(`  成功: ${migratedCount}件`);
    console.log(`  エラー: ${errorCount}件`);

    // 5. 移行後の確認
    const afterNewFormatDocs = await evaluationsCollection.countDocuments({
      relationshipType: { $exists: true }
    });
    console.log(`\n✨ 移行後の新フォーマット数: ${afterNewFormatDocs}/${totalDocs}\n`);

    // 6. データ型確認
    console.log('🔍 relationshipType の型確認:');
    const sample = await evaluationsCollection.findOne(
      { relationshipType: { $exists: true } },
      { projection: { relationshipType: 1, relationship: 1 } }
    );

    if (sample) {
      console.log('  サンプルデータ:', {
        relationshipType: sample.relationshipType,
        type: typeof sample.relationshipType,
        old_relationship: sample.relationship
      });
    }

    console.log('\n✅ 移行が完了しました！');
    console.log('\n📝 次のステップ:');
    console.log('  1. アプリケーションを再起動してください');
    console.log('  2. いくつかの評価を表示して正しく動作するか確認してください');
    console.log('  3. 問題なければ、旧 relationship フィールドは後で削除できます\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ 移行中にエラーが発生しました:', error);
    process.exit(1);
  }
}

// スクリプト実行
migrateRelationshipData();
