const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function setAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const result = await mongoose.connection.db.collection('users').updateOne(
      { email: 'tomura@hackjpn.com' },
      { $set: { isAdmin: true } }
    );

    console.log('Result:', result);
    
    // 確認
    const user = await mongoose.connection.db.collection('users').findOne({ email: 'tomura@hackjpn.com' });
    console.log('User:', user ? { email: user.email, isAdmin: user.isAdmin, name: user.name } : 'Not found');

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

setAdmin();
