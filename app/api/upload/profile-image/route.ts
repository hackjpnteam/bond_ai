import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import connectDB from '@/lib/mongodb';
import UserProfile from '@/models/UserProfile';
import User from '@/models/User';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    await connectDB();
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new Response(
        JSON.stringify({ error: 'ファイルが選択されていません' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // ファイルサイズ制限 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: 'ファイルサイズは5MB以下にしてください' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // ファイル形式チェック
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({ error: 'JPG、PNG、WebP形式のファイルのみ対応しています' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // ファイル名生成
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const filename = `${user.id}_${timestamp}.${extension}`;
    
    // アップロードディレクトリ作成
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'profiles');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }
    
    // ファイル保存
    const filepath = join(uploadDir, filename);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);
    
    // データベース更新
    const profileImageUrl = `/uploads/profiles/${filename}`;
    
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
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'プロフィール画像をアップロードしました',
        profileImage: profileImageUrl
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('Profile image upload error:', error);
    return new Response(
      JSON.stringify({ error: 'アップロードに失敗しました' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});