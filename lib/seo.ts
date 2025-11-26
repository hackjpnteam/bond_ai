import { Metadata } from 'next'

export interface SEOConfig {
  title: string
  description: string
  keywords?: string[]
  canonicalUrl?: string
  ogImage?: string
  noIndex?: boolean
  jsonLd?: object
}

// 本番ドメインは bond.giving
const BASE_URL = 'https://bond.giving'
const SITE_NAME = 'Bond'
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.png`

export const defaultSEO: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Bond Launch - 信頼ネットワークで企業評価を可視化するプラットフォーム',
    template: '%s | Bond Launch'
  },
  description: '透明性の高い評価システムで企業の信頼度を可視化。投資家、従業員、顧客からの実際の評価でスタートアップの成長を支援するプラットフォーム。',
  icons: {
    icon: '/bond-logo.png',
    apple: '/bond-logo.png',
    shortcut: '/bond-logo.png',
  },
  keywords: [
    '企業評価', 'スタートアップ', '投資家', '信頼度', '評価システム',
    'ベンチャー', '企業分析', 'AI企業', 'ギグー', 'StartupHub', 'DigitalSolutions',
    '企業ランキング', '会社評価', '投資判断', 'デューデリジェンス'
  ],
  authors: [{ name: 'Bond Launch Team' }],
  creator: 'Bond Launch',
  publisher: 'Bond Launch',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: 'Bond Launch - 企業評価プラットフォーム',
    description: '透明性の高い評価システムで企業の信頼度を可視化するプラットフォーム',
    url: BASE_URL,
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: 'Bond Launch - 企業評価プラットフォーム',
      },
    ],
    locale: 'ja_JP',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bond Launch - 企業評価プラットフォーム',
    description: '透明性の高い評価システムで企業の信頼度を可視化',
    images: [DEFAULT_OG_IMAGE],
    creator: '@BondLaunch',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
  },
}

export function generateSEO(config: SEOConfig): Metadata {
  const title = config.title
  const description = config.description
  const url = config.canonicalUrl ? `${BASE_URL}${config.canonicalUrl}` : BASE_URL
  const ogImage = config.ogImage || DEFAULT_OG_IMAGE

  return {
    title,
    description,
    keywords: config.keywords?.join(', '),
    canonical: url,
    openGraph: {
      title,
      description,
      url,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: 'website',
      siteName: SITE_NAME,
      locale: 'ja_JP',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
      creator: '@BondLaunch',
    },
    robots: {
      index: !config.noIndex,
      follow: !config.noIndex,
    },
    alternates: {
      canonical: url,
    },
  }
}

// 構造化データ生成
export function generateOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Bond Launch',
    alternateName: 'ボンドローンチ',
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description: '透明性の高い評価システムで企業の信頼度を可視化するプラットフォーム',
    foundingDate: '2024',
    industry: 'Technology',
    numberOfEmployees: '10-50',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'JP',
      addressRegion: '東京都',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'support@bond-launch.com',
      availableLanguage: 'Japanese'
    },
    sameAs: [
      'https://twitter.com/BondLaunch',
      'https://linkedin.com/company/bond-launch',
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.5',
      reviewCount: '128',
      bestRating: '5',
      worstRating: '1'
    }
  }
}

export function generateCompanyJsonLd(company: {
  name: string
  description: string
  rating: number
  reviewCount: number
  industry: string
  location: string
  employees: number
  established: string
  url: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: company.name,
    description: company.description,
    url: company.url,
    industry: company.industry,
    foundingDate: company.established.replace('年設立', ''),
    numberOfEmployees: company.employees.toString(),
    address: {
      '@type': 'PostalAddress',
      addressRegion: company.location,
      addressCountry: 'JP'
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: company.rating.toString(),
      reviewCount: company.reviewCount.toString(),
      bestRating: '5',
      worstRating: '1'
    }
  }
}

export function generateReviewJsonLd(reviews: Array<{
  author: string
  rating: number
  reviewBody: string
  datePublished: string
  itemReviewed: string
}>) {
  return reviews.map(review => ({
    '@context': 'https://schema.org',
    '@type': 'Review',
    author: {
      '@type': 'Person',
      name: review.author
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.rating.toString(),
      bestRating: '5',
      worstRating: '1'
    },
    reviewBody: review.reviewBody,
    datePublished: review.datePublished,
    itemReviewed: {
      '@type': 'Organization',
      name: review.itemReviewed
    }
  }))
}

// キーワード戦略
export const targetKeywords = {
  primary: [
    '企業評価 プラットフォーム',
    'スタートアップ 評価',
    '投資家 企業分析',
    '会社 信頼度',
    'ベンチャー企業 ランキング'
  ],
  secondary: [
    'AI企業 評価',
    'ギグー 評価',
    'StartupHub 評価',
    'DigitalSolutions 評価',
    '企業 口コミ',
    '投資判断 ツール',
    'デューデリジェンス プラットフォーム'
  ],
  longTail: [
    'AI スタートアップ 企業評価 ランキング',
    '投資家向け 企業分析 プラットフォーム',
    '透明性の高い 企業評価システム',
    'ベンチャー企業 信頼度 可視化',
    '日本 スタートアップ 評価サイト'
  ]
}