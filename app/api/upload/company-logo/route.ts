import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { put } from '@vercel/blob';
import path from 'path';

export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    const formData = await request.formData();
    const file = formData.get('logo') as File;
    const companySlug = formData.get('companySlug') as string;

    if (!file) {
      return NextResponse.json({ error: 'ファイルが選択されていません' }, { status: 400 });
    }

    if (!companySlug) {
      return NextResponse.json({ error: '会社スラッグが指定されていません' }, { status: 400 });
    }

    // ファイルサイズ制限 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'ファイルサイズは5MB以下にしてください' }, { status: 400 });
    }

    // ファイル形式チェック
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: '対応している画像形式: JPEG, PNG, GIF, WebP' }, { status: 400 });
    }

    // ファイル拡張子を取得
    const fileExtension = path.extname(file.name) || '.png';

    // ファイル名を会社スラッグベースで生成
    const fileName = `logos/${companySlug}${fileExtension}`;

    // Vercel Blobにアップロード
    const blob = await put(fileName, file, {
      access: 'public',
      addRandomSuffix: false, // 同じファイル名で上書き
    });

    console.log(`Company logo uploaded: ${fileName} for ${companySlug}`);

    return NextResponse.json({
      success: true,
      message: '会社ロゴがアップロードされました',
      logoUrl: blob.url,
      fileName: blob.pathname
    });

  } catch (error: any) {
    console.error('Company logo upload error:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      code: error?.code
    });

    // より詳細なエラーメッセージを返す
    const errorMessage = error?.message || 'ロゴのアップロードに失敗しました';
    return NextResponse.json({
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }, { status: 500 });
  }
});