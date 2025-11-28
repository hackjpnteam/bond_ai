import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import connectDB from '@/lib/mongodb';
import Person from '@/models/Person';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const personSlug = formData.get('personSlug') as string;

    if (!file) {
      return NextResponse.json({ error: 'ファイルが必要です' }, { status: 400 });
    }

    if (!personSlug) {
      return NextResponse.json({ error: '人物のslugが必要です' }, { status: 400 });
    }

    // ファイルタイプの検証
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: '対応していないファイル形式です' }, { status: 400 });
    }

    // ファイルサイズの検証（5MB以下）
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'ファイルサイズは5MB以下にしてください' }, { status: 400 });
    }

    await connectDB();

    // 人物の存在確認
    const decodedSlug = decodeURIComponent(personSlug);
    const person = await Person.findOne({
      $or: [
        { slug: decodedSlug },
        { name: decodedSlug }
      ]
    });

    if (!person) {
      return NextResponse.json({ error: '人物が見つかりません' }, { status: 404 });
    }

    // ファイル名を生成
    const ext = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const safeSlug = decodedSlug.replace(/[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, '_');
    const fileName = `person_${safeSlug}_${timestamp}.${ext}`;

    // 保存ディレクトリを作成
    const uploadDir = path.join(process.cwd(), 'public/uploads/people');
    await mkdir(uploadDir, { recursive: true });

    // ファイルを保存
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    // 画像URLを生成
    const imageUrl = `/uploads/people/${fileName}`;

    // データベースを更新
    await Person.updateOne(
      { _id: person._id },
      {
        $set: {
          imageUrl: imageUrl,
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json({
      success: true,
      imageUrl: imageUrl,
      message: '画像をアップロードしました'
    });

  } catch (error) {
    console.error('Error uploading person image:', error);
    return NextResponse.json({ error: '画像のアップロードに失敗しました' }, { status: 500 });
  }
}
