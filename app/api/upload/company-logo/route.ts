import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import connectDB from '@/lib/mongodb';

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

    // ファイルサイズ制限 (2MB - Base64保存なので小さめに)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'ファイルサイズは2MB以下にしてください' }, { status: 400 });
    }

    // ファイル形式チェック
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: '対応している画像形式: JPEG, PNG, GIF, WebP' }, { status: 400 });
    }

    // Base64に変換
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    // MongoDBに保存
    await connectDB();
    const db = (await import('mongoose')).connection.db;

    await db?.collection('companyLogos').updateOne(
      { slug: companySlug },
      {
        $set: {
          slug: companySlug,
          logo: dataUrl,
          mimeType: file.type,
          updatedAt: new Date(),
          updatedBy: user.id
        }
      },
      { upsert: true }
    );

    console.log(`Company logo saved to MongoDB: ${companySlug}`);

    return NextResponse.json({
      success: true,
      message: '会社ロゴがアップロードされました',
      logoUrl: `/api/company-logo/${companySlug}`,
    });

  } catch (error: any) {
    console.error('Company logo upload error:', error);
    return NextResponse.json({
      error: error?.message || 'ロゴのアップロードに失敗しました'
    }, { status: 500 });
  }
});
