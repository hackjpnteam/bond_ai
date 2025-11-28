import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const decodedSlug = decodeURIComponent(slug);

    await connectDB();
    const db = (await import('mongoose')).connection.db;

    // 複数のパターンでロゴを検索（完全一致優先）
    let logoDoc = await db?.collection('companyLogos').findOne({ slug: decodedSlug });

    // 見つからない場合、大文字小文字無視で検索
    if (!logoDoc) {
      logoDoc = await db?.collection('companyLogos').findOne({
        slug: { $regex: new RegExp(`^${decodedSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      });
    }

    // まだ見つからない場合、会社名から検索
    if (!logoDoc) {
      // companiesコレクションから会社名を取得
      const company = await db?.collection('companies').findOne({
        $or: [
          { slug: decodedSlug },
          { slug: { $regex: new RegExp(`^${decodedSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
          { name: decodedSlug },
          { name: { $regex: new RegExp(`^${decodedSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }
        ]
      });

      if (company) {
        // 会社名でロゴを検索
        const companyName = company.name?.replace(/^株式会社/, '').trim();
        logoDoc = await db?.collection('companyLogos').findOne({
          $or: [
            { slug: company.name },
            { slug: companyName },
            { slug: { $regex: new RegExp(`^${companyName?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }
          ]
        });
      }
    }

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
