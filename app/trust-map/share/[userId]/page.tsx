import { Metadata } from 'next';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import mongoose from 'mongoose';
import SharedTrustMapClient from './SharedTrustMapClient';

type Props = {
  params: Promise<{ userId: string }>;
};

const DEFAULT_OG = 'https://bond.giving/og-trustmap-default.png';
const APP_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://bond.giving';

// ユーザーを取得するヘルパー関数
async function getUser(userId: string) {
  await connectDB();

  let user = null;

  // ObjectIdで検索
  if (mongoose.Types.ObjectId.isValid(userId)) {
    user = await User.findById(userId).lean();
  }

  // usernameで検索
  if (!user) {
    user = await User.findOne({ username: userId }).lean();
  }

  // emailの@前部分で検索
  if (!user) {
    user = await User.findOne({ email: new RegExp(`^${userId}@`, 'i') }).lean();
  }

  return user;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { userId } = await params;
  const user = await getUser(userId);

  const title = user
    ? `${(user as any).name}さんの信頼マップ - Bond`
    : 'Bond 信頼マップ';

  const description = user
    ? `${(user as any).name}さんのBondで作成された信頼ネットワークです。つながりと信頼関係を可視化しています。`
    : 'Bondで共有された信頼ネットワークです。つながりと信頼関係を可視化しています。';

  // OGP画像URL（ユーザーがアップロードした画像 or デフォルト）
  const ogImage = (user as any)?.trustmapOgImageUrl || DEFAULT_OG;

  const shareUrl = `${APP_URL}/trust-map/share/${userId}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: shareUrl,
      siteName: 'Bond',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function SharedTrustMapPage({ params }: Props) {
  const { userId } = await params;

  return <SharedTrustMapClient userId={userId} />;
}
