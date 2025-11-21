import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/admin/',
          '/_next/',
          '/static/',
          '*.json',
        ],
      },
      {
        userAgent: 'GPTBot',
        allow: [
          '/',
          '/bond-evaluation',
          '/company/*',
          '/timeline',
          '/ranking',
        ],
      },
      {
        userAgent: 'Claude-Web',
        allow: [
          '/',
          '/bond-evaluation', 
          '/company/*',
          '/timeline',
          '/ranking',
        ],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: [
          '/',
          '/bond-evaluation',
          '/company/*', 
          '/timeline',
          '/ranking',
        ],
      },
      {
        userAgent: 'CCBot',
        allow: [
          '/',
          '/bond-evaluation',
          '/company/*',
          '/timeline', 
          '/ranking',
        ],
      },
    ],
    sitemap: 'https://bond.ai/sitemap.xml',
    host: 'https://bond.ai',
  }
}