/**
 * Trust Map シェアページ用レイアウト
 * - 動的にユーザー情報を取得してメタデータを生成
 * - OGP画像は opengraph-image.tsx で自動生成されるため、ここでは images を指定しない
 * - 今後の拡張: APIからユーザー名を取得してタイトルに反映可能
 */
import type { Metadata } from 'next'

type LayoutProps = {
  children: React.ReactNode
  params: Promise<{ userId: string }>
}

// 動的メタデータ生成
export async function generateMetadata({
  params,
}: {
  params: Promise<{ userId: string }>
}): Promise<Metadata> {
  const { userId } = await params

  // TODO: 将来的にはここで API からユーザー表示名を取得可能
  // const userData = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/trust-map/share/${userId}`)
  const displayName = userId

  const title = `${displayName}さんの信頼ネットワーク | Bond`
  const description = `${displayName}さんの信頼でつながるネットワークをBondで可視化。企業やユーザーとの信頼関係をご覧ください。`
  const url = `/trust-map/share/${userId}`

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
  }
}

export default async function TrustMapShareLayout({ children }: LayoutProps) {
  return children
}
