/**
 * Trust Map シェアページ（短縮URL）
 * ルート: /trustmap/[id]
 * - 短いURLでトラストマップをシェア可能
 * - メタデータは generateMetadata で動的生成
 * - OGP画像は opengraph-image.tsx で自動生成
 */
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

type TrustMapPageProps = {
  params: Promise<{ id: string }>
}

// 動的メタデータ生成
export async function generateMetadata({
  params,
}: TrustMapPageProps): Promise<Metadata> {
  const { id } = await params

  // TODO: 将来的にはここで API からユーザー表示名を取得可能
  const displayId = id

  const baseTitle = 'Bond – Trust Map'
  const title = `${displayId}さんの信頼ネットワーク | ${baseTitle}`
  const description = `${displayId}さんの信頼でつながるネットワークをBondで可視化。`

  const url = `/trustmap/${id}`

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
      // images は twitter-image.tsx が自動的に紐づくため指定しない
    },
  }
}

// このページは trust-map/share/[userId] にリダイレクト
export default async function TrustMapPage({ params }: TrustMapPageProps) {
  const { id } = await params
  redirect(`/trust-map/share/${id}`)
}
