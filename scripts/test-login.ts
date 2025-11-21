import connectDB from '../lib/mongodb';
import User from '../models/User';
import bcrypt from 'bcryptjs';

async function testLogin() {
  try {
    await connectDB();

    const email = 'tomura@hackjpn.com';
    const password = 'password123';

    const user = await User.findOne({ email });

    if (!user) {
      console.log('❌ ユーザーが見つかりませんでした');
      process.exit(1);
    }

    console.log('✅ ユーザーが見つかりました:');
    console.log('   Email:', user.email);
    console.log('   Name:', user.name);
    console.log('   Verified:', user.verified);
    console.log('   Password exists:', !!user.password);
    console.log('   Password length:', user.password?.length);
    console.log('   Provider:', user.provider || 'なし');

    if (user.password) {
      // パスワード比較テスト
      const isValid = await bcrypt.compare(password, user.password);
      console.log('\n🔐 パスワード検証:');
      console.log('   入力パスワード:', password);
      console.log('   検証結果:', isValid ? '✅ 正しい' : '❌ 間違い');

      // comparePasswordメソッドのテスト
      const isValidMethod = await user.comparePassword(password);
      console.log('   comparePasswordメソッド:', isValidMethod ? '✅ 正しい' : '❌ 間違い');
    } else {
      console.log('\n⚠️  パスワードが設定されていません（OAuth経由のユーザー？）');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ エラー:', error);
    process.exit(1);
  }
}

testLogin();
