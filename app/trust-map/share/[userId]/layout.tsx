/**
 * Trust Map シェアページ用レイアウト
 * - 動的にユーザー情報を取得してメタデータを生成
 * - OGP画像は opengraph-image.tsx で自動生成されるため、ここでは images を指定しない
 */
import type { Metadata } from 'next'

type LayoutProps = {
  children: React.ReactNode
  params: Promise<{ userId: string }>
}

// APIからユーザー情報を取得
async function getUserData(userId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  try {
    const res = await fetch(`${baseUrl}/api/trust-map/share/${userId}`, {
      cache: 'no-store',
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

// 動的メタデータ生成
export async function generateMetadata({
  params,
}: {
  params: Promise<{ userId: string }>
}): Promise<Metadata> {
  const { userId } = await params

  // APIからユーザー情報を取得
  const userData = await getUserData(userId)
  const displayName = userData?.me?.name || userId
  const companyCount = userData?.companies?.length || 0
  const connectionCount = userData?.users?.length || 0

  const title = `${displayName}さんの信頼ネットワーク | Bond`
  const description = `${displayName}さんの信頼でつながるネットワーク。${companyCount}社の企業、${connectionCount}人のつながりをBondで可視化。`
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bond.giving'
  const url = `${baseUrl}/trust-map/share/${userId}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      siteName: 'Bond',
      locale: 'ja_JP',
      // images は opengraph-image.tsx が自動的に紐づくため指定しない
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      // images は opengraph-image.tsx / twitter-image.tsx が自動的に紐づくため指定しない
    },
    // Facebook用の追加メタタグ
    other: {
      'fb:app_id': process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '',
    },
  }
}

export default async function TrustMapShareLayout({ children }: LayoutProps) {
  return children
}
