import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

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
    
    // 保存先ディレクトリを確保
    const uploadDir = path.join(process.cwd(), 'public', 'logos');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // ファイル名を会社スラッグベースで生成
    const fileName = `${companySlug}${fileExtension}`;
    const filePath = path.join(uploadDir, fileName);

    // 古いロゴファイルをクリーンアップ（同じ会社の別ファイル名を削除）
    const { readdirSync, unlinkSync } = await import('fs');
    try {
      const existingFiles = readdirSync(uploadDir);
      const companyNameVariants = [
        companySlug.toLowerCase(),
        companySlug.replace(/^株式会社/, '').toLowerCase(),
        companySlug.replace(/^株式会社/, '').trim()
      ];
      
      existingFiles.forEach(file => {
        if (file !== fileName && file.endsWith('.png')) {
          const fileBase = file.replace(/\.[^/.]+$/, '').toLowerCase();
          if (companyNameVariants.some(variant => fileBase.includes(variant) || variant.includes(fileBase))) {
            try {
              unlinkSync(path.join(uploadDir, file));
              console.log(`Removed old logo file: ${file}`);
            } catch (error) {
              console.log(`Could not remove old logo file: ${file}`);
            }
          }
        }
      });
    } catch (error) {
      console.log('Could not cleanup old files:', error.message);
    }

    // 新しいファイルを保存
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    console.log(`Company logo uploaded: ${fileName} for ${companySlug}`);

    return NextResponse.json({
      success: true,
      message: '会社ロゴがアップロードされました',
      logoUrl: `/logos/${fileName}`,
      fileName
    });

  } catch (error) {
    console.error('Company logo upload error:', error);
    return NextResponse.json({ error: 'ロゴのアップロードに失敗しました' }, { status: 500 });
  }
});