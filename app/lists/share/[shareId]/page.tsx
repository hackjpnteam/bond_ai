import { Metadata } from 'next';
import connectDB from '@/lib/mongodb';
import SharedList from '@/models/SharedList';
import User from '@/models/User';
import SharedListClient from './SharedListClient';

type Props = {
  params: Promise<{ shareId: string }>;
};

const APP_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://bond.giving';

async function getSharedList(shareId: string) {
  await connectDB();
  const sharedList = await SharedList.findOne({ shareId }).lean();
  if (!sharedList) return null;

  const owner = await User.findById(sharedList.ownerId)
    .select('name image company')
    .lean();

  return { sharedList, owner };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { shareId } = await params;
  const data = await getSharedList(shareId);

  const title = data
    ? `${data.sharedList.title} - ${(data.owner as any)?.name || '匿名'}さんのリスト | Bond`
    : 'Bond 共有リスト';

  const description = data?.sharedList.description
    ? data.sharedList.description
    : data
    ? `${(data.owner as any)?.name || '匿名'}さんが共有した「${data.sharedList.title}」リスト。タグ: ${data.sharedList.tags.join(', ')}`
    : 'Bondで共有されたリストです。';

  const shareUrl = `${APP_URL}/lists/share/${shareId}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: shareUrl,
      siteName: 'Bond',
      type: 'website',
      locale: 'ja_JP',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function SharedListPage({ params }: Props) {
  const { shareId } = await params;

  return <SharedListClient shareId={shareId} />;
}
