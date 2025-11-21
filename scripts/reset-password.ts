import connectDB from '../lib/mongodb';
import User from '../models/User';

async function resetPassword() {
  try {
    await connectDB();

    const email = 'tomura@hackjpn.com';
    const newPassword = 'password123'; // 開発用の簡単なパスワード

    const user = await User.findOne({ email });

    if (!user) {
      console.log('❌ ユーザーが見つかりませんでした');
      process.exit(1);
    }

    console.log('✅ ユーザーが見つかりました:');
    console.log('   Email:', user.email);
    console.log('   Name:', user.name);
    console.log('   Verified:', user.verified);

    // パスワードを更新（Mongooseのpreフックで自動的にハッシュ化される）
    user.password = newPassword;
    user.verified = true; // ついでに認証済みにする
    await user.save();

    console.log('\n✅ パスワードをリセットしました！');
    console.log('   新しいパスワード:', newPassword);
    console.log('   ログインURL: http://localhost:3000/auth/login');

    process.exit(0);
  } catch (error) {
    console.error('❌ エラー:', error);
    process.exit(1);
  }
}

resetPassword();
