/**
 * Trust Map シェアページ用レイアウト
 * - 動的にユーザー情報を取得してメタデータを生成
 * - trustmapOgImageUrl がある場合はそれを使用、なければ opengraph-image.tsx のフォールバック
 */
import type { Metadata } from 'next'

type LayoutProps = {
  children: React.ReactNode
  params: Promise<{ userId: string }>
}

// APIからユーザー情報を取得
async function getUserData(userId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bond.giving'
  console.log('[Share Layout] Fetching user data for:', userId)
  try {
    const res = await fetch(`${baseUrl}/api/trust-map/share/${userId}`, {
      cache: 'no-store',
    })
    if (!res.ok) {
      console.log('[Share Layout] API returned error:', res.status)
      return null
    }
    const data = await res.json()
    console.log('[Share Layout] Got user data:', { name: data?.me?.name, companies: data?.companies?.length, ogImageUrl: data?.trustmapOgImageUrl })
    return data
  } catch (error) {
    console.error('[Share Layout] Fetch error:', error)
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
  const trustmapOgImageUrl = userData?.trustmapOgImageUrl || null

  const title = `${displayName}さんの信頼ネットワーク | Bond`
  const description = `${displayName}さんの信頼でつながるネットワーク。${companyCount}社の企業、${connectionCount}人のつながりをBondで可視化。`
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bond.giving'
  const url = `${baseUrl}/trust-map/share/${userId}`

  // OGP画像の設定
  // trustmapOgImageUrl がある場合はそれを使用し、opengraph-image.tsx より優先
  // ない場合は opengraph-image.tsx が自動的にフォールバックとして使われる
  const ogImages = trustmapOgImageUrl
    ? [
        {
          url: trustmapOgImageUrl,
          width: 1200,
          height: 630,
          alt: `${displayName}さんの信頼マップ`,
        },
      ]
    : undefined

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
      // trustmapOgImageUrl がある場合のみ images を指定
      // 指定しない場合は opengraph-image.tsx が自動的に紐づく
      ...(ogImages && { images: ogImages }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      // trustmapOgImageUrl がある場合のみ images を指定
      ...(ogImages && { images: ogImages }),
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
