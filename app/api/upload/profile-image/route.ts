import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import connectDB from '@/lib/mongodb';
import UserProfile from '@/models/UserProfile';
import User from '@/models/User';

export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    await connectDB();

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'ファイルが選択されていません' },
        { status: 400 }
      );
    }

    // ファイルサイズ制限 (2MB - Base64保存なので小さめに)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'ファイルサイズは2MB以下にしてください' },
        { status: 400 }
      );
    }

    // ファイル形式チェック
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'JPG、PNG、WebP形式のファイルのみ対応しています' },
        { status: 400 }
      );
    }

    // Base64に変換
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    // MongoDBに保存
    const db = (await import('mongoose')).connection.db;

    await db?.collection('profileImages').updateOne(
      { userId: user.id },
      {
        $set: {
          userId: user.id,
          image: dataUrl,
          mimeType: file.type,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );

    // プロフィール画像URLを生成
    const profileImageUrl = `/api/profile-image/${user.id}`;

    // UserProfileに保存
    let userProfile = await UserProfile.findOne({ userId: user.id });
    if (!userProfile) {
      userProfile = new UserProfile({
        userId: user.id,
        profileImage: profileImageUrl
      });
    } else {
      userProfile.profileImage = profileImageUrl;
    }
    await userProfile.save();

    // Userモデルにも画像URLを保存
    await User.findByIdAndUpdate(user.id, {
      image: profileImageUrl
    });

    console.log(`Profile image saved to MongoDB: ${user.id}`);

    return NextResponse.json({
      success: true,
      message: 'プロフィール画像をアップロードしました',
      profileImage: profileImageUrl
    });

  } catch (error: any) {
    console.error('Profile image upload error:', error);
    return NextResponse.json(
      { error: error?.message || 'アップロードに失敗しました' },
      { status: 500 }
    );
  }
});
