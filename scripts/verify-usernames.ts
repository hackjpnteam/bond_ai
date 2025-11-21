import connectDB from '@/lib/mongodb';
import User from '@/models/User';

async function verifyUsernames() {
  try {
    await connectDB();

    const users = await User.find({}).select('name email username').lean();
    console.log(`\n📊 Found ${users.length} users:\n`);

    users.forEach((u: any) => {
      console.log(`Username: ${u.username || 'NOT SET'}`);
      console.log(`  Name: ${u.name}`);
      console.log(`  Email: ${u.email}\n`);
    });

  } catch (error) {
    console.error('Error:', error);
  }

  process.exit(0);
}

verifyUsernames();
