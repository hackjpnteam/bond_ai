import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const BOND_ADMIN_EMAIL = 'tomura@hackjpn.com';

const WELCOME_MESSAGE_CONTENT = `あなたが2件の評価を贈ってくれたこと、
まずは心からありがとう。

AIがあらゆる文章や広告をつくり出す時代に、
あなたが「誰かの価値」を自分の言葉で讃えた行為は、
それ自体が大きな信頼の灯火です。

Bondは、江戸の村で人と人が支え合っていた頃のように、
行いと人間性が"信用"になる世界を取り戻すことが使命です。

あなたの評価は、その世界を一歩前に進めてくれました。
誰かの挑戦を支え、誰かの未来の信用をつくっています。

AIの時代だからこそ、
人間にしか生み出せない価値があります。

Bondは、それを可視化するために生まれました。
あなたがその最初の担い手になってくれて、本当に嬉しいです。

これからも一緒に、
恩送りが自然にめぐる世界をつくっていきましょう。

戸村 光
CEO, hackjpn / Bond Founder`;

async function resendWelcomeMessages() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error('MONGODB_URI is not set');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;
  if (!db) {
    console.error('Database connection not established');
    process.exit(1);
  }

  const usersCollection = db.collection('users');
  const messagesCollection = db.collection('messages');

  // Find Bond admin user
  const bondAdmin = await usersCollection.findOne({ email: BOND_ADMIN_EMAIL });
  if (!bondAdmin) {
    console.error('Bond admin not found');
    process.exit(1);
  }

  console.log(`Found Bond admin: ${bondAdmin.name} (${bondAdmin._id})`);

  // Delete ALL messages from hikaru tomura
  const deleteResult = await messagesCollection.deleteMany({
    sender: bondAdmin._id
  });
  console.log(`Deleted ${deleteResult.deletedCount} messages from Hikaru Tomura`);

  // Get all users except admin
  const users = await usersCollection.find({
    email: { $ne: BOND_ADMIN_EMAIL }
  }).toArray();

  console.log(`Found ${users.length} users to send messages to`);

  // Send new welcome message to each user
  let sentCount = 0;
  let errors = 0;

  for (const user of users) {
    try {
      await messagesCollection.insertOne({
        sender: bondAdmin._id,
        recipient: user._id,
        subject: 'ご挨拶',
        content: WELCOME_MESSAGE_CONTENT,
        read: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      sentCount++;
      console.log(`✓ Sent to: ${user.email}`);
    } catch (err) {
      console.error(`✗ Failed to send to ${user.email}:`, err);
      errors++;
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Messages deleted: ${deleteResult.deletedCount}`);
  console.log(`New messages sent: ${sentCount}`);
  console.log(`Errors: ${errors}`);

  await mongoose.disconnect();
  console.log('\nDone!');
}

resendWelcomeMessages().catch(console.error);
