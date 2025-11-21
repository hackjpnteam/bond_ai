import connectDB from '../lib/mongodb';
import User from '../models/User';

async function updateUserInterests() {
  await connectDB();

  // hikaruユーザーに興味分野とスキルを追加
  const hikaru = await User.findOne({ username: 'hikaru' });
  if (hikaru) {
    hikaru.interests = ['AI', 'ヘルステック', 'スタートアップ投資', 'プロダクト開発'];
    hikaru.skills = ['TypeScript', 'React', 'Next.js', 'MongoDB'];
    await hikaru.save();
    console.log('✅ hikaruの興味分野とスキルを更新しました');
    console.log('Interests:', hikaru.interests);
    console.log('Skills:', hikaru.skills);
  }

  // teamユーザーにも追加
  const team = await User.findOne({ username: 'team' });
  if (team) {
    team.interests = ['スタートアップ', 'ビジネス開発', '資金調達', 'チームビルディング'];
    team.skills = ['経営戦略', 'マーケティング', 'セールス', 'プレゼンテーション'];
    await team.save();
    console.log('✅ teamの興味分野とスキルを更新しました');
    console.log('Interests:', team.interests);
    console.log('Skills:', team.skills);
  }

  // kimuserユーザーにも追加
  const kimuser = await User.findOne({ username: 'kimuser' });
  if (kimuser) {
    kimuser.interests = ['デザイン', 'UI/UX', 'フロントエンド', 'アクセシビリティ'];
    kimuser.skills = ['Figma', 'Adobe XD', 'CSS', 'アニメーション'];
    await kimuser.save();
    console.log('✅ kimuserの興味分野とスキルを更新しました');
    console.log('Interests:', kimuser.interests);
    console.log('Skills:', kimuser.skills);
  }

  process.exit(0);
}

updateUserInterests();
