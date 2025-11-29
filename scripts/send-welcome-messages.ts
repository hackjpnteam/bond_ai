import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const BOND_ADMIN_EMAIL = 'tomura@hackjpn.com';

const WELCOME_MESSAGE_CONTENT = `この度はご登録ありがとうございます。これを機にどうかよろしくお願いします。

AI時代が本格的に始まり、タイムラインは"AIがつくった広告"であふれ返るようになりました。

資本が広告を支配し、アルゴリズムが人の注意を奪い合う世界。
そんな時代だからこそ、私たちはあえて逆張りをします。

「人と人の信頼こそが、商売を強く、美しくする。」

Bondは、その原点を取り戻すために生まれました。

Bondは、あなたの信頼の歴史を読み解き、未来の信用力を予測する"与信評価AIエージェント"です。

従来の数字だけでは測れない「人間の価値」を、静かに可視化し、
恩送りが自然に生まれる世界を共に作りましょう。

戸村光
Bond支配人`;

async function sendWelcomeMessages() {
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

  // Find Bond admin user
  const usersCollection = db.collection('users');
  const messagesCollection = db.collection('messages');

  const bondAdmin = await usersCollection.findOne({ email: BOND_ADMIN_EMAIL });
  if (!bondAdmin) {
    console.error('Bond admin not found');
    process.exit(1);
  }

  console.log(`Found Bond admin: ${bondAdmin.name} (${bondAdmin._id})`);

  // Get all users except admin
  const users = await usersCollection.find({
    email: { $ne: BOND_ADMIN_EMAIL }
  }).toArray();

  console.log(`Found ${users.length} users (excluding admin)`);

  // Get existing welcome messages from admin
  const existingMessages = await messagesCollection.find({
    sender: bondAdmin._id,
    subject: 'ご挨拶'
  }).toArray();

  const existingRecipientIds = new Set(
    existingMessages.map(m => m.recipient.toString())
  );

  console.log(`Found ${existingRecipientIds.size} users who already have welcome message`);

  // Filter users who haven't received the welcome message
  const usersToMessage = users.filter(
    user => !existingRecipientIds.has(user._id.toString())
  );

  console.log(`Will send welcome message to ${usersToMessage.length} users`);

  // Send welcome message to each user
  let sentCount = 0;
  let errors = 0;

  for (const user of usersToMessage) {
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
  console.log(`Total users: ${users.length}`);
  console.log(`Already had message: ${existingRecipientIds.size}`);
  console.log(`Messages sent: ${sentCount}`);
  console.log(`Errors: ${errors}`);

  await mongoose.disconnect();
  console.log('\nDone!');
}

sendWelcomeMessages().catch(console.error);
