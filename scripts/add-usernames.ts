/**
 * ユーザーにusernameフィールドを追加するスクリプト
 */

import connectDB from '@/lib/mongodb';
import User from '@/models/User';

// 名前からusernameを生成する関数
function generateUsername(name: string, email: string): string {
  // まず名前をベースにする
  if (name) {
    // 日本語の名前をローマ字風に変換（簡易版）
    const nameMap: { [key: string]: string } = {
      '戸村': 'tomura',
      '瀬戸': 'seto',
      '光志': 'hikaru',
      'Hikaru': 'hikaru',
      'Tomura': 'tomura',
      'Rihito': 'rihito'
    };

    // 名前のマッピングを試す
    for (const [jpName, username] of Object.entries(nameMap)) {
      if (name.includes(jpName)) {
        return username;
      }
    }

    // マッピングがない場合は名前をそのまま使用（小文字、スペース削除）
    return name.toLowerCase().replace(/\s+/g, '');
  }

  // 名前がない場合はemailの@前を使用
  return email.split('@')[0];
}

async function addUsernames() {
  try {
    await connectDB();
    console.log('✅ MongoDB connected\n');

    const users = await User.find({});
    console.log(`📊 Found ${users.length} users\n`);

    for (const user of users) {
      if (!user.username) {
        const username = generateUsername(user.name, user.email);

        // usernameが既に使用されているかチェック
        const existingUser = await User.findOne({ username });

        let finalUsername = username;
        if (existingUser && existingUser._id.toString() !== user._id.toString()) {
          // 既に使用されている場合は数字を付ける
          let counter = 1;
          while (await User.findOne({ username: `${username}${counter}` })) {
            counter++;
          }
          finalUsername = `${username}${counter}`;
        }

        // usernameを更新
        user.username = finalUsername;
        await user.save();

        console.log(`✅ Updated user: ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Username: ${finalUsername}\n`);
      } else {
        console.log(`⏭️  Skipped user: ${user.name} (already has username: ${user.username})\n`);
      }
    }

    console.log('✅ All users updated successfully!');
    console.log('\n📋 Final usernames:');

    const updatedUsers = await User.find({}).select('name email username');
    updatedUsers.forEach(u => {
      console.log(`   ${u.username} → ${u.name} (${u.email})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }

  process.exit(0);
}

addUsernames();
