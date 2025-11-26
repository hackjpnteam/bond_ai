import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    await connectDB();
    const db = (await import('mongoose')).connection.db;

    const logoDoc = await db?.collection('companyLogos').findOne({ slug });

    if (!logoDoc || !logoDoc.logo) {
      // デフォルト画像を返す（または404）
      return NextResponse.json({ error: 'Logo not found' }, { status: 404 });
    }

    // Base64データURLからバイナリに変換
    const base64Data = logoDoc.logo.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': logoDoc.mimeType || 'image/png',
        'Cache-Control': 'public, max-age=86400', // 24時間キャッシュ
      },
    });

  } catch (error: any) {
    console.error('Company logo fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch logo' }, { status: 500 });
  }
}
