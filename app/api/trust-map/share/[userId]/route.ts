import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Evaluation from '@/models/Evaluation';
import Connection from '@/models/Connection';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await connectDB();

    const { userId } = await params;
    console.log('[Share API] Received userId:', userId);

    // ユーザー情報を取得（ObjectIdまたはusernameで検索）
    let user;
    if (mongoose.Types.ObjectId.isValid(userId)) {
      user = await User.findById(userId).lean();
    }
    if (!user) {
      // usernameで検索
      user = await User.findOne({ username: userId }).lean();
    }
    if (!user) {
      // emailの@前部分で検索
      user = await User.findOne({ email: new RegExp(`^${userId}@`, 'i') }).lean();
    }
    if (!user) {
      console.log('[Share API] User not found for userId:', userId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const odlId = (user as any)._id;
    const odlIdStr = odlId.toString();
    console.log('[Share API] Found user:', (user as any).name, 'ObjectId:', odlIdStr);

    // 複数のuserIdパターンで評価を検索（/api/trust-map/route.tsと同じロジック）
    const possibleUserIds = [
      odlIdStr, // ObjectId文字列
      new mongoose.Types.ObjectId(odlIdStr), // ObjectId オブジェクト
      `u_${(user as any).name?.toLowerCase().replace(/\s/g, '_')}`, // "u_名前"形式
      (user as any).email?.split('@')[0], // メールの@前部分
      `u_${(user as any).email?.split('@')[0]}`, // "u_メール前部分"形式
    ].filter(Boolean);

    console.log('[Share API] Searching with userIds:', possibleUserIds.map(id => id?.toString?.() || id));

    // ユーザーの評価を取得（複数のパターンで検索）
    const db = mongoose.connection.db;

    // 集計で評価を取得（/api/trust-map/route.tsと同じロジック）
    const reviews = await db.collection("evaluations").aggregate([
      { $match: { userId: { $in: possibleUserIds } } },
      {
        $group: {
          _id: "$companySlug",
          companyName: { $first: "$companyName" },
          reviewCount: { $sum: 1 },
          strength: { $avg: "$rating" },
          relationshipType: { $first: "$relationshipType" }
        }
      }
    ]).toArray();

    console.log('[Share API] Found reviews:', reviews.length);

    // 企業データを構築（/api/trust-map/route.tsと同様のロゴ取得ロジック）
    const uniqueCompanies = await Promise.all(
      reviews.map(async (r: any) => {
        // 会社情報を検索
        const company = await db.collection("companies").findOne({
          $or: [
            { slug: r._id },
            { name: r.companyName }
          ]
        });

        const fullCompanyName = company?.name || r.companyName || r._id || "Unknown";
        const displayName = fullCompanyName.replace(/^株式会社/, '').trim();

        // ロゴファイル名を決定（/api/trust-map/route.tsと同様）
        let logoFileName;
        if (fullCompanyName.toLowerCase().includes('sopital')) {
          logoFileName = 'sopital';
        } else if (fullCompanyName.toLowerCase().includes('hokuto')) {
          logoFileName = 'hokuto';
        } else if (fullCompanyName.toLowerCase().includes('chatwork')) {
          logoFileName = 'chatwork';
        } else if (fullCompanyName.toLowerCase().includes('hackjpn')) {
          logoFileName = 'hackjpn';
        } else if (fullCompanyName.toLowerCase().includes('ギグー')) {
          logoFileName = 'ギグー';
        } else if (fullCompanyName.toLowerCase().includes('ホーミー')) {
          logoFileName = 'ホーミー';
        } else if (company?.slug) {
          logoFileName = company.slug.replace(/^株式会社/, '');
        } else {
          logoFileName = r._id?.replace(/^株式会社/, '') || displayName;
        }

        // ロゴURLを構築
        const logoUrl = `/logos/${logoFileName}.png`;

        return {
          id: displayName,
          fullName: fullCompanyName,
          type: 'org' as const,
          imageUrl: logoUrl,
          reviewCount: r.reviewCount,
          strength: Math.round(r.strength * 10) / 10,
        };
      })
    );

    // コネクションを取得（ObjectIdで検索）
    const connections = await Connection.find({
      users: odlId,
      status: 'active'
    }).populate('users', 'name image').lean();

    const connectedUsers = connections.map((conn: any) => {
      const otherUser = conn.users.find((u: any) => u._id.toString() !== odlIdStr);
      if (!otherUser) return null;
      return {
        id: otherUser._id.toString(),
        name: otherUser.name,
        type: 'person' as const,
        imageUrl: otherUser.image || '/default-avatar.png',
        strength: conn.strength || 1,
      };
    }).filter(Boolean);

    const response = {
      me: {
        id: odlIdStr,
        name: (user as any).name,
        type: 'person' as const,
        isCenter: true,
        imageUrl: (user as any).image || '/default-avatar.png',
        reviewCount: uniqueCompanies.reduce((sum: number, c: any) => sum + c.reviewCount, 0),
      },
      companies: uniqueCompanies,
      users: connectedUsers,
    };

    console.log('[Share API] Response:', {
      userName: response.me.name,
      companies: response.companies.length,
      users: response.users.length,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching shared trust map:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
