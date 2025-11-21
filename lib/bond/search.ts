import fetch from 'node-fetch';
import { Source, SearchWebResult } from '@/types/bond';

const USER_AGENT = 'BondBot/1.0';
const MAX_CONTENT_LENGTH = 50000;

export async function searchWeb(query: string): Promise<Source[]> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    console.error('SERPER_API_KEY is not set');
    return [];
  }

  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query,
        num: 10,
      }),
    });

    if (!response.ok) {
      console.error(`Serper API error: ${response.status}`);
      return [];
    }

    const data = (await response.json()) as SearchWebResult;
    const sources: Source[] = [];

    if (data.organic) {
      for (const result of data.organic) {
        sources.push({
          url: result.link,
          title: result.title,
          description: result.snippet,
          published_at: parseDateLoose(result.date),
        });
      }
    }

    if (data.news) {
      for (const result of data.news) {
        sources.push({
          url: result.link,
          title: result.title,
          description: result.snippet,
          published_at: parseDateLoose(result.date),
        });
      }
    }

    return normalizeSources(rankSources(sources));
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

export async function fetchPageText(url: string): Promise<string> {
  const timeout = parseInt(process.env.BOND_TIMEOUT_MS || '20000');
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT,
      },
      signal: controller.signal as any,
      redirect: 'follow',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Failed to fetch ${url}: ${response.status}`);
      return '';
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
      console.warn(`Skipping non-text content: ${contentType}`);
      return '';
    }

    const html = await response.text();
    
    // Basic HTML to text conversion
    let text = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();

    // Truncate to max length
    if (text.length > MAX_CONTENT_LENGTH) {
      text = text.substring(0, MAX_CONTENT_LENGTH) + '...';
    }

    return text;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.warn(`Timeout fetching ${url}`);
    } else {
      console.warn(`Error fetching ${url}:`, error.message);
    }
    return '';
  }
}

export function normalizeSources(sources: Source[]): Source[] {
  const seenDomains = new Set<string>();
  const normalized: Source[] = [];

  for (const source of sources) {
    // Clean URL from tracking parameters
    let cleanUrl = source.url;
    try {
      const url = new URL(cleanUrl);
      // Remove tracking parameters
      const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid', 'ref', 'source'];
      for (const param of trackingParams) {
        url.searchParams.delete(param);
      }
      cleanUrl = url.toString();
      
      // Extract domain
      const domain = url.hostname.replace(/^www\./, '');
      
      // Skip if we've already seen this domain
      if (seenDomains.has(domain)) {
        continue;
      }
      seenDomains.add(domain);
      
      normalized.push({
        ...source,
        url: cleanUrl,
        domain,
      });
    } catch {
      // Invalid URL, skip
      continue;
    }
  }

  return normalized;
}

export function parseDateLoose(str?: string): string | undefined {
  if (!str) return undefined;

  // Try to find date patterns
  const patterns = [
    // ISO date
    /(\d{4})-(\d{1,2})-(\d{1,2})/,
    // Japanese date
    /(\d{4})年(\d{1,2})月(\d{1,2})日/,
    // US date
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
    // Common formats
    /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* (\d{1,2}),? (\d{4})/i,
  ];

  for (const pattern of patterns) {
    const match = str.match(pattern);
    if (match) {
      // Try to construct a valid date
      try {
        let year, month, day;
        
        if (pattern.source.includes('\\d{4}')) {
          // Year is first or last
          if (match.index === 0) {
            [, year, month, day] = match;
          } else {
            [, day, month, year] = match;
          }
        } else if (match[1].match(/[A-Za-z]/)) {
          // Month name
          const months: Record<string, number> = {
            'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
            'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
          };
          const monthName = match[1].toLowerCase().substring(0, 3);
          month = months[monthName];
          day = match[2];
          year = match[3];
        }

        if (year && month && day) {
          const y = parseInt(year);
          const m = parseInt(month as string);
          const d = parseInt(day as string);
          
          if (y >= 1900 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
            return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          }
        }
      } catch {
        continue;
      }
    }
  }

  // Try relative dates
  const now = new Date();
  const lowerStr = str.toLowerCase();
  
  if (lowerStr.includes('today') || lowerStr.includes('今日')) {
    return formatDate(now);
  }
  if (lowerStr.includes('yesterday') || lowerStr.includes('昨日')) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return formatDate(yesterday);
  }
  
  // Check for "X days ago"
  const daysAgoMatch = str.match(/(\d+)\s*(days?|日)\s*ago|前/i);
  if (daysAgoMatch) {
    const days = parseInt(daysAgoMatch[1]);
    const date = new Date(now);
    date.setDate(date.getDate() - days);
    return formatDate(date);
  }

  return undefined;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function rankSources(sources: Source[]): Source[] {
  return sources.sort((a, b) => {
    // Priority scoring
    const getScore = (source: Source) => {
      let score = 0;
      const url = source.url.toLowerCase();
      const domain = source.domain?.toLowerCase() || '';

      // Official sites
      if (domain.includes('.go.jp') || domain.includes('.gov')) score += 100;
      if (domain.includes('.co.jp') || domain.includes('.com')) score += 50;
      
      // IR pages
      if (url.includes('/ir/') || url.includes('investor')) score += 80;
      
      // News sites
      const newsdomains = ['nikkei', 'reuters', 'bloomberg', 'techcrunch', 'zdnet', 'itmedia'];
      if (newsdomains.some(d => domain.includes(d))) score += 70;
      
      // Recent dates
      if (source.published_at) {
        const date = new Date(source.published_at);
        const daysAgo = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
        if (daysAgo < 7) score += 60;
        else if (daysAgo < 30) score += 40;
        else if (daysAgo < 90) score += 20;
      }

      return score;
    };

    return getScore(b) - getScore(a);
  });
}