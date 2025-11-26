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
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const odlId = (user as any)._id;
    const odlIdStr = odlId.toString();

    // ユーザーの評価を取得（文字列IDで検索 - Evaluationモデルの仕様）
    const evaluations = await Evaluation.find({ userId: odlIdStr }).lean();

    // 企業データを構築
    const companies = evaluations.map((evaluation: any) => ({
      id: evaluation.companyId || evaluation.companyName,
      fullName: evaluation.companyName,
      type: 'org' as const,
      imageUrl: evaluation.companyLogo || '/default-company.png',
      reviewCount: 1,
      strength: evaluation.overallRating || 3,
    }));

    // 重複を除去
    const uniqueCompanies = companies.reduce((acc: any[], curr: any) => {
      const existing = acc.find(c => c.id === curr.id);
      if (existing) {
        existing.reviewCount++;
        existing.strength = Math.max(existing.strength, curr.strength);
      } else {
        acc.push(curr);
      }
      return acc;
    }, []);

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
        reviewCount: evaluations.length,
      },
      companies: uniqueCompanies,
      users: connectedUsers,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching shared trust map:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
