import { Metadata } from 'next';
import connectDB from '@/lib/mongodb';
import Company from '@/models/Company';
import Evaluation from '@/models/Evaluation';

interface Props {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}

// 会社データを取得
async function getCompanyData(slug: string) {
  try {
    await connectDB();
    const decodedSlug = decodeURIComponent(slug);

    const company = await Company.findOne({
      $or: [
        { slug: slug.toLowerCase() },
        { slug: decodedSlug.toLowerCase() },
        { name: slug },
        { name: decodedSlug }
      ]
    }).lean();

    return company;
  } catch (error) {
    console.error('Error fetching company for metadata:', error);
    return null;
  }
}

// 評価データを取得
async function getEvaluations(companyName: string) {
  try {
    await connectDB();
    const evaluations = await Evaluation.find({
      $or: [
        { companyName: companyName },
        { companySlug: companyName.toLowerCase() }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    return evaluations;
  } catch (error) {
    console.error('Error fetching evaluations for metadata:', error);
    return [];
  }
}

// 説明文をクリーンアップ（Markdown/JSON除去）
function cleanDescription(description: string | undefined): string {
  if (!description) return '';

  let clean = description
    // JSONブロック除去
    .replace(/```json[\s\S]*?```/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\{[\s\S]*?"answer"[\s\S]*?\}/g, '')
    // Markdown除去
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/#{1,6}\s+/g, '')
    .replace(/[-*•]\s+/g, '')
    // 改行と空白の正規化
    .replace(/\\n/g, ' ')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return clean;
}

// 説明文を要約（メタディスクリプション用）
function summarizeDescription(description: string | undefined, maxLength: number = 160): string {
  const clean = cleanDescription(description);
  if (!clean) return '';
  if (clean.length <= maxLength) return clean;

  // 文の途中で切れないように調整
  const truncated = clean.substring(0, maxLength);
  const lastPeriod = truncated.lastIndexOf('。');
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastPeriod > maxLength * 0.6) {
    return truncated.substring(0, lastPeriod + 1);
  } else if (lastSpace > maxLength * 0.6) {
    return truncated.substring(0, lastSpace) + '...';
  }

  return truncated + '...';
}

// レポートから主要なポイントを抽出
function extractKeyPoints(description: string | undefined): string[] {
  if (!description) return [];

  const clean = cleanDescription(description);
  const sentences = clean.split(/[。！？]/).filter(s => s.trim().length > 10);

  // 重要そうな文を抽出（事業内容、特徴、実績など）
  const keywords = ['事業', '提供', '展開', '設立', '従業員', '特徴', 'サービス', '製品', '技術', '実績'];
  const keyPoints = sentences
    .filter(s => keywords.some(k => s.includes(k)))
    .slice(0, 5)
    .map(s => s.trim());

  return keyPoints.length > 0 ? keyPoints : sentences.slice(0, 3).map(s => s.trim());
}

// 動的メタデータ生成
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const company = await getCompanyData(slug);
  const evaluations = await getEvaluations(company?.name || decodedSlug);

  const companyName = company?.name || decodedSlug;
  const description = company?.description || '';
  const industry = company?.industry || '';
  const founded = company?.founded || '';
  const employees = company?.employees || '';
  const website = company?.website || '';
  const averageRating = company?.averageRating || 0;
  const reviewCount = evaluations.length;

  // レポート内容からキーポイントを抽出
  const keyPoints = extractKeyPoints(description);
  const cleanDesc = cleanDescription(description);

  // SEO用の説明文を生成（レポート内容を優先的に使用）
  let metaDescription = '';
  if (cleanDesc && cleanDesc.length > 50) {
    // レポート内容がある場合、最初の部分を使用
    metaDescription = summarizeDescription(cleanDesc, 155);
  } else {
    // フォールバック
    metaDescription = `${companyName}の企業情報、評判、口コミをBondで確認。${industry && industry !== '情報収集中...' ? `業界: ${industry}。` : ''}${averageRating > 0 ? `平均評価: ${averageRating.toFixed(1)}点(${reviewCount}件)。` : ''}信頼性の高い評価情報をお届けします。`;
  }

  // キーワードを生成（レポート内容から動的に生成）
  const baseKeywords = [
    companyName,
    `${companyName} 評判`,
    `${companyName} 口コミ`,
    `${companyName} 企業情報`,
    `${companyName} 評価`,
    `${companyName} 年収`,
    `${companyName} 採用`,
  ];

  // 業界キーワードを追加
  if (industry && industry !== '情報収集中...') {
    baseKeywords.push(industry, `${industry} 企業`);
  }

  // レポートから抽出したキーワードを追加
  const reportKeywords = extractKeywordsFromReport(description);
  const allKeywords = [...new Set([...baseKeywords, ...reportKeywords, '企業評価', '会社評判', 'Bond'])].filter(Boolean);

  // タイトルを生成
  const title = `${companyName}の評判・口コミ・企業情報${industry && industry !== '情報収集中...' ? `【${industry}】` : ''} | Bond`;

  // OGP用の説明文（少し長め、レポート内容を含む）
  const ogDescription = cleanDesc && cleanDesc.length > 50
    ? summarizeDescription(cleanDesc, 200)
    : `${companyName}の企業情報と評判をチェック。${industry && industry !== '情報収集中...' ? `${industry}業界。` : ''}${founded && founded !== '情報収集中' ? `設立: ${founded}。` : ''}${employees && employees !== '情報収集中' ? `従業員数: ${employees}。` : ''}Bondで実際の関係者からの評価を確認できます。`;

  // 構造化データ用のURL
  const canonicalUrl = `https://bond.giving/company/${encodeURIComponent(slug)}`;

  return {
    title,
    description: metaDescription,
    keywords: allKeywords.join(', '),
    authors: [{ name: 'Bond' }],
    creator: 'Bond',
    publisher: 'Bond',
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
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: 'website',
      locale: 'ja_JP',
      url: canonicalUrl,
      siteName: 'Bond - 企業評判プラットフォーム',
      title: `${companyName}の評判・口コミ | Bond`,
      description: ogDescription,
      images: [
        {
          url: `https://bond.giving/api/og/company?name=${encodeURIComponent(companyName)}&rating=${averageRating.toFixed(1)}&industry=${encodeURIComponent(industry || '')}`,
          width: 1200,
          height: 630,
          alt: `${companyName}の企業情報`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${companyName}の評判・口コミ | Bond`,
      description: ogDescription,
      site: '@Bond_giving',
      creator: '@Bond_giving',
    },
    other: {
      'article:author': 'Bond',
      'article:section': industry || '企業情報',
      ...(averageRating > 0 && {
        'rating': averageRating.toFixed(1),
        'ratingCount': String(reviewCount),
      }),
    },
  };
}

// レポートからキーワードを抽出
function extractKeywordsFromReport(description: string | undefined): string[] {
  if (!description) return [];

  const clean = cleanDescription(description);
  const keywords: string[] = [];

  // よく使われるビジネス用語を検索
  const businessTerms = [
    'AI', 'DX', 'SaaS', 'クラウド', 'IoT', 'FinTech', 'ヘルスケア',
    'EC', 'マーケティング', 'コンサルティング', 'スタートアップ',
    'プラットフォーム', 'ソリューション', '医療', '教育', '不動産',
    'メディア', 'エンターテイメント', '製造', '物流', '小売'
  ];

  businessTerms.forEach(term => {
    if (clean.includes(term)) {
      keywords.push(term);
    }
  });

  return keywords.slice(0, 5);
}

// JSON-LD構造化データを生成（複数のスキーマ）
function generateStructuredData(company: any, evaluations: any[], slug: string) {
  if (!company) return [];

  const companyName = company.name;
  const cleanDesc = cleanDescription(company.description);
  const canonicalUrl = `https://bond.giving/company/${encodeURIComponent(slug)}`;
  const sources = company.sources || [];

  const schemas: any[] = [];

  // 1. Organization スキーマ（企業情報）
  const organizationSchema: any = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${canonicalUrl}#organization`,
    name: companyName,
    description: summarizeDescription(cleanDesc, 500),
    url: canonicalUrl,
  };

  if (company.website && company.website !== '情報収集中') {
    organizationSchema.sameAs = [company.website];
  }
  if (company.industry && company.industry !== '情報収集中...') {
    organizationSchema.industry = company.industry;
  }
  if (company.founded && company.founded !== '情報収集中') {
    // 年を抽出（例: "2020年" → "2020"）
    const yearMatch = company.founded.match(/(\d{4})/);
    if (yearMatch) {
      organizationSchema.foundingDate = yearMatch[1];
    }
  }
  if (company.employees && company.employees !== '情報収集中') {
    // 数字を抽出
    const numMatch = company.employees.match(/(\d+)/);
    if (numMatch) {
      organizationSchema.numberOfEmployees = {
        '@type': 'QuantitativeValue',
        value: parseInt(numMatch[1]),
      };
    }
  }

  // 評価がある場合、AggregateRatingを追加
  if (company.averageRating > 0 || evaluations.length > 0) {
    const avgRating = company.averageRating ||
      (evaluations.length > 0
        ? evaluations.reduce((sum: number, e: any) => sum + (e.rating || 0), 0) / evaluations.length
        : 0);

    if (avgRating > 0) {
      organizationSchema.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: avgRating.toFixed(1),
        bestRating: '5',
        worstRating: '1',
        reviewCount: evaluations.length || company.searchCount || 1,
      };
    }
  }

  schemas.push(organizationSchema);

  // 2. WebPage スキーマ
  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': canonicalUrl,
    name: `${companyName}の評判・口コミ・企業情報`,
    description: summarizeDescription(cleanDesc, 200),
    url: canonicalUrl,
    inLanguage: 'ja',
    isPartOf: {
      '@type': 'WebSite',
      '@id': 'https://bond.giving/#website',
      name: 'Bond',
      url: 'https://bond.giving',
    },
    about: {
      '@id': `${canonicalUrl}#organization`,
    },
    dateModified: company.updatedAt ? new Date(company.updatedAt).toISOString() : new Date().toISOString(),
    ...(sources.length > 0 && {
      citation: sources.slice(0, 5).map((s: any) => ({
        '@type': 'WebPage',
        url: s.url,
        name: s.title || s.url,
      })),
    }),
  };
  schemas.push(webPageSchema);

  // 3. BreadcrumbList スキーマ（パンくずリスト）
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Bond',
        item: 'https://bond.giving',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: '企業検索',
        item: 'https://bond.giving/search',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: companyName,
        item: canonicalUrl,
      },
    ],
  };
  schemas.push(breadcrumbSchema);

  // 4. Article スキーマ（企業レポート記事として）
  if (cleanDesc && cleanDesc.length > 200) {
    const articleSchema = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      '@id': `${canonicalUrl}#article`,
      headline: `${companyName}の企業情報・評判レポート`,
      description: summarizeDescription(cleanDesc, 200),
      articleBody: cleanDesc.substring(0, 2000),
      author: {
        '@type': 'Organization',
        name: 'Bond',
        url: 'https://bond.giving',
      },
      publisher: {
        '@type': 'Organization',
        name: 'Bond',
        url: 'https://bond.giving',
        logo: {
          '@type': 'ImageObject',
          url: 'https://bond.giving/bond-logo.png',
        },
      },
      mainEntityOfPage: canonicalUrl,
      datePublished: company.createdAt ? new Date(company.createdAt).toISOString() : new Date().toISOString(),
      dateModified: company.updatedAt ? new Date(company.updatedAt).toISOString() : new Date().toISOString(),
      about: {
        '@id': `${canonicalUrl}#organization`,
      },
    };
    schemas.push(articleSchema);
  }

  // 5. Review スキーマ（個別の評価）
  if (evaluations.length > 0) {
    evaluations.slice(0, 5).forEach((evaluation: any, index: number) => {
      const reviewSchema = {
        '@context': 'https://schema.org',
        '@type': 'Review',
        '@id': `${canonicalUrl}#review-${index}`,
        itemReviewed: {
          '@id': `${canonicalUrl}#organization`,
        },
        reviewRating: {
          '@type': 'Rating',
          ratingValue: evaluation.rating || 0,
          bestRating: 5,
          worstRating: 1,
        },
        reviewBody: evaluation.comment || '',
        author: {
          '@type': 'Person',
          name: evaluation.isAnonymous ? '匿名ユーザー' : (evaluation.userName || 'Bondユーザー'),
        },
        datePublished: evaluation.createdAt ? new Date(evaluation.createdAt).toISOString() : undefined,
      };
      schemas.push(reviewSchema);
    });
  }

  // 6. FAQPage スキーマ（よくある質問形式で企業情報を構造化）
  const faqItems: any[] = [];

  if (company.industry && company.industry !== '情報収集中...') {
    faqItems.push({
      '@type': 'Question',
      name: `${companyName}はどのような業界の企業ですか？`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `${companyName}は${company.industry}業界の企業です。`,
      },
    });
  }

  if (company.founded && company.founded !== '情報収集中') {
    faqItems.push({
      '@type': 'Question',
      name: `${companyName}はいつ設立されましたか？`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `${companyName}は${company.founded}に設立されました。`,
      },
    });
  }

  if (company.employees && company.employees !== '情報収集中') {
    faqItems.push({
      '@type': 'Question',
      name: `${companyName}の従業員数は？`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `${companyName}の従業員数は${company.employees}です。`,
      },
    });
  }

  if (company.averageRating > 0) {
    faqItems.push({
      '@type': 'Question',
      name: `${companyName}の評判・評価は？`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `${companyName}のBondでの平均評価は${company.averageRating.toFixed(1)}点（5点満点）です。`,
      },
    });
  }

  if (faqItems.length > 0) {
    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqItems,
    };
    schemas.push(faqSchema);
  }

  return schemas;
}

export default async function CompanyLayout({ params, children }: Props) {
  const { slug } = await params;
  const company = await getCompanyData(slug);
  const evaluations = await getEvaluations(company?.name || decodeURIComponent(slug));
  const structuredDataArray = generateStructuredData(company, evaluations, slug);

  return (
    <>
      {structuredDataArray.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema),
          }}
        />
      ))}
      {children}
    </>
  );
}
