import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '信頼ネットワーク | Bond',
  description: 'あなたの信頼ネットワークを可視化。信頼でつながるビジネスマッチングプラットフォーム Bond',
  openGraph: {
    title: '信頼ネットワーク | Bond',
    description: 'あなたの信頼ネットワークを可視化。信頼でつながるビジネスマッチングプラットフォーム Bond',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '信頼ネットワーク | Bond',
    description: 'あなたの信頼ネットワークを可視化。信頼でつながるビジネスマッチングプラットフォーム Bond',
  },
}

export default function TrustMapLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
