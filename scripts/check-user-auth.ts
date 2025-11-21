import connectDB from '@/lib/mongodb';
import User from '@/models/User';

async function checkUserAuth() {
  try {
    await connectDB();

    const users = await User.find({}).limit(5).lean();
    console.log(`\n📊 Found ${users.length} users:\n`);

    users.forEach((u: any) => {
      console.log(`User: ${u.name || 'No name'}`);
      console.log(`  Email: ${u.email}`);
      console.log(`  Has Password: ${u.password ? 'Yes' : 'No'}`);
      console.log(`  Password Hash: ${u.password ? u.password.substring(0, 20) + '...' : 'None'}`);
      console.log(`  Created: ${u.createdAt}\n`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

checkUserAuth();
