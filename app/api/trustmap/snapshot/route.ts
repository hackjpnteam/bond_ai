/**
 * トラストマップのスナップショット画像をアップロードするAPI
 * - クライアントで生成されたPNG画像を受け取り、Vercel Blobにアップロード
 * - ユーザーのtrustmapOgImageUrlを更新
 */
import { NextRequest, NextResponse } from 'next/server';
import { put, del } from '@vercel/blob';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    // セッション認証
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Content-Typeチェック
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    }

    // FormDataからファイルとuserIdを取得
    const formData = await req.formData();
    const file = formData.get('file');
    const userId = formData.get('userId')?.toString();

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // DBに接続してユーザーを検証
    await connectDB();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 自分のトラストマップのみアップロード可能（またはセッションユーザーと一致）
    if (user.email !== session.user.email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 古い画像があれば削除（オプション）
    if (user.trustmapOgImageUrl && user.trustmapOgImageUrl.includes('blob.vercel-storage.com')) {
      try {
        await del(user.trustmapOgImageUrl);
      } catch (e) {
        console.warn('Failed to delete old trustmap OG image:', e);
      }
    }

    // ファイル名とパスを定義
    const fileName = `trustmaps/${userId}/${Date.now()}.png`;

    // Vercel Blobにアップロード
    const blob = await put(fileName, file, {
      access: 'public',
      contentType: 'image/png',
    });

    const ogImageUrl = blob.url;

    // ユーザーのtrustmapOgImageUrlを更新
    await User.findByIdAndUpdate(userId, { trustmapOgImageUrl: ogImageUrl });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bond.giving';
    const shareUrl = `${baseUrl}/trust-map/share/${userId}`;

    return NextResponse.json({
      ok: true,
      userId,
      ogImageUrl,
      shareUrl,
    });
  } catch (error) {
    console.error('Error in /api/trustmap/snapshot:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
