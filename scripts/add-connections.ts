import connectDB from '../lib/mongodb';
import User from '../models/User';
import { ObjectId } from 'mongodb';

async function addTestConnections() {
  await connectDB();
  const db = (await connectDB()).connection.db;

  // ユーザーを取得
  const hikaru = await User.findOne({ username: 'hikaru' });
  const team = await User.findOne({ username: 'team' });
  const tomura = await User.findOne({ username: 'tomura' });

  if (!hikaru || !team || !tomura) {
    console.error('❌ 一部のユーザーが見つかりません');
    console.log('hikaru:', !!hikaru, 'team:', !!team, 'tomura:', !!tomura);
    process.exit(1);
  }

  // 既存のコネクションを確認
  const existingConnections = await db.collection('connections').countDocuments({
    users: { $all: [hikaru._id, team._id] }
  });

  if (existingConnections > 0) {
    console.log('✅ 既にコネクションが存在します');
  } else {
    // hikaruとteamのコネクションを作成
    await db.collection('connections').insertOne({
      _id: new ObjectId(),
      users: [hikaru._id, team._id],
      status: 'active',
      createdAt: new Date('2025-11-01'),
      updatedAt: new Date('2025-11-01')
    });
    console.log('✅ hikaru ↔ team のコネクションを作成しました');
  }

  // hikaruとtomuraのコネクション
  const existingConnections2 = await db.collection('connections').countDocuments({
    users: { $all: [hikaru._id, tomura._id] }
  });

  if (existingConnections2 === 0) {
    await db.collection('connections').insertOne({
      _id: new ObjectId(),
      users: [hikaru._id, tomura._id],
      status: 'active',
      createdAt: new Date('2025-11-02'),
      updatedAt: new Date('2025-11-02')
    });
    console.log('✅ hikaru ↔ tomura のコネクションを作成しました');
  }

  // コネクション数を確認
  const hikaruConnections = await db.collection('connections').countDocuments({
    users: hikaru._id,
    status: 'active'
  });

  console.log(`\n✅ hikaru のコネクション数: ${hikaruConnections}`);
  console.log(`\nバッジ獲得条件:`);
  console.log(`  🤝 コネクター: 10人以上 (現在: ${hikaruConnections})`);
  console.log(`  🌐 ネットワーカー: 25人以上`);
  console.log(`  ⭐ スーパーコネクター: 50人以上`);
  console.log(`  👑 メガコネクター: 100人以上`);

  process.exit(0);
}

addTestConnections();
