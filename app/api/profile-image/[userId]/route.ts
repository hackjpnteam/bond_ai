import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await connectDB();

    const { userId } = await params;
    const db = (await import('mongoose')).connection.db;

    const profileImage = await db?.collection('profileImages').findOne({ userId });

    if (!profileImage || !profileImage.image) {
      return NextResponse.json(
        { error: 'プロフィール画像が見つかりません' },
        { status: 404 }
      );
    }

    // data:image/jpeg;base64,xxx... の形式からバイナリに変換
    const matches = profileImage.image.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
      return NextResponse.json(
        { error: '画像データが無効です' },
        { status: 500 }
      );
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });

  } catch (error) {
    console.error('Profile image fetch error:', error);
    return NextResponse.json(
      { error: 'プロフィール画像の取得に失敗しました' },
      { status: 500 }
    );
  }
}
