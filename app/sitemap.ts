import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://bond.ai'
  
  // 静的ページ
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/timeline`,
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/ranking`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }
  ]

  // 動的に会社ページを追加
  const companyPages = generateCompanyPages(baseUrl)

  return [...staticPages, ...companyPages]
}

function generateCompanyPages(baseUrl: string) {
  // 人気企業やよく検索される企業
  const popularCompanies = [
    'Apple',
    'Microsoft', 
    'Google',
    'Tesla',
    'Amazon',
    'Meta',
    'Netflix',
    'Uber',
    'Airbnb',
    'Spotify',
    'hackjpn',
    'OpenAI',
    'Anthropic',
    'DeepMind',
    'Stripe',
    'Square',
    'PayPal',
    'Salesforce',
    'Zoom',
    'Slack',
    'Docker',
    'MongoDB',
    'Redis',
    'Elasticsearch',
    'GitHub',
    'GitLab',
    'Figma',
    'Notion',
    'Airtable',
    'Webflow'
  ]

  return popularCompanies.map(company => ({
    url: `${baseUrl}/company/${encodeURIComponent(company)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))
}