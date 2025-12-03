import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth-middleware';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import SharedList from '@/models/SharedList';
import SharedListEditHistory from '@/models/SharedListEditHistory';

export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const user = await validateSession(request);
    if (!user) {
      return NextResponse.json(
        { error: 'ログインが必要です' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('logo') as File;
    const slug = formData.get('slug') as string;
    const shareId = formData.get('shareId') as string | null;
    const itemName = formData.get('itemName') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'ファイルが選択されていません' },
        { status: 400 }
      );
    }

    if (!slug) {
      return NextResponse.json(
        { error: '企業情報が不正です' },
        { status: 400 }
      );
    }

    // ファイルサイズチェック（2MB）
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'ファイルサイズは2MB以下にしてください' },
        { status: 400 }
      );
    }

    // 画像形式チェック
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: '画像ファイルを選択してください' },
        { status: 400 }
      );
    }

    // ファイルをBase64に変換
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    await connectDB();
    const db = mongoose.connection.db;

    // companyLogosコレクションに保存（upsert）
    await db?.collection('companyLogos').updateOne(
      { slug: slug },
      {
        $set: {
          slug: slug,
          logo: dataUrl,
          mimeType: file.type,
          uploadedBy: user.id,
          updatedAt: new Date()
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      { upsert: true }
    );

    // companiesコレクションも更新（存在する場合）
    await db?.collection('companies').updateOne(
      {
        $or: [
          { slug: slug },
          { slug: { $regex: new RegExp(`^${slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
          { name: slug },
          { name: { $regex: new RegExp(`^${slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }
        ]
      },
      {
        $set: {
          'basicInfo.logo': dataUrl,
          logo: dataUrl,
          logoUpdatedAt: new Date(),
          logoUpdatedBy: user.id
        }
      }
    );

    // 編集履歴を保存（shareIdがある場合）
    if (shareId) {
      const sharedList = await SharedList.findOne({ shareId });
      if (sharedList) {
        await SharedListEditHistory.create({
          sharedListId: sharedList._id,
          userId: user.id,
          action: 'update_logo',
          itemName: itemName || slug,
          field: 'logo'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'ロゴを更新しました'
    });

  } catch (error: any) {
    console.error('Logo upload error:', error);
    return NextResponse.json(
      { error: 'ロゴのアップロードに失敗しました' },
      { status: 500 }
    );
  }
}
