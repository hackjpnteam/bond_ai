import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { searchWeb, fetchPageText } from '@/lib/bond/search';
import {
  buildSystemPrompt,
  buildUserPrompt,
  extractJsonFromResponse,
  buildFallbackResponse
} from '@/lib/bond/prompt';
import { ApiRequest, ApiResponse, Source, Fact, CompanyCandidate } from '@/types/bond';
import dbConnect from '@/lib/mongodb';
import Company from '@/models/Company';
import Person from '@/models/Person';
import Evaluation from '@/models/Evaluation';
import User from '@/models/User';
import mongoose from 'mongoose';

// Initialize Anthropic client (will be created per request to get fresh env)

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let usedTokens = 0;

  try {
    // Parse request body
    const body: ApiRequest = await request.json();
    const { query, mode = 'company', companySlug, categoryKeyword, regionKeyword } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Web検索用のクエリを組み立て
    const searchQueryParts = [query, categoryKeyword, regionKeyword].filter(Boolean);
    const enhancedSearchQuery = searchQueryParts.join(' ');

    // Validate request size
    if (JSON.stringify(body).length > 256 * 1024) {
      return NextResponse.json(
        { error: 'Request too large' },
        { status: 413 }
      );
    }

    console.info(`Search request: query="${query}", mode=${mode}, category="${categoryKeyword || ''}", region="${regionKeyword || ''}"`);

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey.includes('placeholder')) {
      console.warn('Invalid or missing OPENAI_API_KEY');
      return NextResponse.json(
        {
          error: 'OpenAI APIキーが設定されていないため、レポートを生成できません。'
        },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey
    });

    await dbConnect();
    const companyResolution = await resolveCompanyMatches(query, companySlug, {
      categoryKeyword,
      regionKeyword
    });
    if ('selectionRequired' in companyResolution && companyResolution.selectionRequired) {
      return NextResponse.json({
        selectionRequired: true,
        candidates: companyResolution.candidates
      });
    }

    const matchedCompany = companyResolution.matchedCompany;
    let bondScoreStats: BondScoreStats | null = null;
    if (matchedCompany?.slug) {
      bondScoreStats = await getBondScoreStats(matchedCompany.slug);
    }

    const pageContents = new Map<string, string>();
    let promptSources: Source[] = [];
    let fallbackSources: Source[] = [];
    let preferredFacts: Fact[] | null = null;

    if (matchedCompany?.isUserEdited) {
      console.info(`Using user-edited company context for: ${query}`);
      const context = buildUserEditedPromptContext(
        matchedCompany,
        bondScoreStats || { averageRating: 0, reviewCount: 0 }
      );
      promptSources = context.sources;
      fallbackSources = context.sources;
      preferredFacts = context.facts;
      context.pageContents.forEach(({ url, content }) => {
        pageContents.set(url, content);
      });
    } else {
      // Search the web - 絞り込みキーワードを含めた拡張クエリを使用
      const searchResults = await searchWeb(enhancedSearchQuery);
      fallbackSources = searchResults;
      if (searchResults.length === 0) {
        console.warn('No search results found');
        // 検索結果がない場合はDB情報のみで応答
        let response: ApiResponse = {
          answer: matchedCompany?.description
            ? `${matchedCompany.name}についての情報です。\n\n${matchedCompany.description.substring(0, 500)}${matchedCompany.description.length > 500 ? '...' : ''}`
            : `${query}に関する検索結果が見つかりませんでした。`,
          facts: preferredFacts || [
            { label: "会社名", value: matchedCompany?.name || query },
            { label: "業界", value: matchedCompany?.industry || "—" },
            { label: "設立", value: matchedCompany?.founded || "—" },
            { label: "ウェブサイト", value: matchedCompany?.website || "—" }
          ],
          sources: [],
          tokens: 0,
          took_ms: Date.now() - startTime
        };
        response = await attachEnrichment(response, matchedCompany);
        response = applyBondMetadata(response, matchedCompany, query, mode);
        return NextResponse.json(response);
      }

      // Fetch page contents (limited by BOND_MAX_PAGES)
      const maxPages = parseInt(process.env.BOND_MAX_PAGES || '4');
      const pagesToFetch = searchResults.slice(0, maxPages);
      promptSources = pagesToFetch;

      // Fetch pages with throttling
      const fetchPromises = pagesToFetch.map(async (source, index) => {
        await new Promise(resolve => setTimeout(resolve, index * 100));
        const content = await fetchPageText(source.url);
        if (content) {
          pageContents.set(source.url, content);
        }
      });

      await Promise.allSettled(fetchPromises);

      console.info(`Fetched ${pageContents.size} pages out of ${pagesToFetch.length}`);

      // If no content was fetched, return partial result
      if (pageContents.size === 0) {
        // ページ内容取得失敗時は検索結果URLのみで応答
        let response: ApiResponse = {
          answer: matchedCompany?.description
            ? `${matchedCompany.name}についての情報です。\n\n${matchedCompany.description.substring(0, 500)}${matchedCompany.description.length > 500 ? '...' : ''}\n\n詳細は以下の参考資料をご確認ください。`
            : `${query}についてWeb検索を行いました。詳細は参考資料をご確認ください。`,
          facts: preferredFacts || [
            { label: "会社名", value: matchedCompany?.name || query },
            { label: "業界", value: matchedCompany?.industry || "—" },
            { label: "設立", value: matchedCompany?.founded || "—" },
            { label: "ウェブサイト", value: matchedCompany?.website || "—" }
          ],
          sources: fallbackSources.slice(0, 3).map(s => ({
            url: s.url,
            title: s.title,
            published_at: s.published_at
          })),
          tokens: 0,
          took_ms: Date.now() - startTime
        };
        response = await attachEnrichment(response, matchedCompany);
        response = applyBondMetadata(response, matchedCompany, query, mode);
        return NextResponse.json(response);
      }
    }

    // Call OpenAI API
    try {
      const systemPrompt = buildSystemPrompt();
      const userPrompt = buildUserPrompt(query, mode, promptSources, pageContents);

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 4500,  // 1800-2300文字の日本語レポート + JSON構造に必要
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ]
      });

      const responseText = completion.choices[0]?.message?.content || '';

      usedTokens = (completion.usage?.prompt_tokens || 0) + (completion.usage?.completion_tokens || 0);

      // Extract and parse JSON
      let parsed: any;
      try {
        parsed = extractJsonFromResponse(responseText);
      } catch (parseError: any) {
        console.error('Error parsing Claude response:', parseError?.message);
        console.error('Response text (first 500 chars):', responseText.substring(0, 500));
        
        // Use fallback if parsing fails
        parsed = {
          answer: responseText.substring(0, 500) || `${query}についての情報を取得しました。`,
          facts: [
            { label: "サービス概要", value: "—" },
            { label: "プロダクト/事業", value: "—" },
            { label: "創業経緯", value: "—" },
            { label: "代表者/CEO", value: "—" },
            { label: "所在地/拠点", value: "—" },
            { label: "資金調達/投資家", value: "—" },
            { label: "主要顧客/導入実績", value: "—" },
            { label: "直近ニュース", value: "—" }
          ],
          sources: []
        };
      }
      
      const defaultFacts = preferredFacts || [
        { label: "サービス概要", value: "—" },
        { label: "プロダクト/事業", value: "—" },
        { label: "創業経緯", value: "—" },
        { label: "代表者/CEO", value: "—" },
        { label: "所在地/拠点", value: "—" },
        { label: "資金調達/投資家", value: "—" },
        { label: "主要顧客/導入実績", value: "—" },
        { label: "直近ニュース", value: "—" }
      ];

      // Build final response with safe defaults
      let response: ApiResponse = {
        answer: parsed.answer || `${query}についての情報を要約しました。`,
        facts: Array.isArray(parsed.facts) && parsed.facts.length > 0 ? parsed.facts : defaultFacts,
        sources: promptSources.slice(0, 3).map(s => ({
          url: s.url,
          title: s.title,
          published_at: s.published_at
        })),
        tokens: usedTokens,
        took_ms: Date.now() - startTime
      };

      console.info(`Response generated: took_ms=${response.took_ms}, tokens=${usedTokens}`);
      response = await attachEnrichment(response, matchedCompany);
      response = applyBondMetadata(response, matchedCompany, query, mode);
      return NextResponse.json(response);

    } catch (openaiError: any) {
      console.error('OpenAI API error:', openaiError?.message);

      // OpenAI失敗時は検索結果のみで基本レスポンスを返す
      const basicFacts: Fact[] = preferredFacts || [
        { label: "会社名", value: matchedCompany?.name || query },
        { label: "業界", value: matchedCompany?.industry || "情報収集中..." },
        { label: "設立", value: matchedCompany?.founded || "—" },
        { label: "所在地", value: matchedCompany?.headquarters || matchedCompany?.location || "—" },
        { label: "ウェブサイト", value: matchedCompany?.website || "—" },
        { label: "従業員数", value: matchedCompany?.employees || "—" },
        { label: "サービス概要", value: matchedCompany?.description?.substring(0, 100) || "情報収集中..." },
        { label: "直近ニュース", value: fallbackSources[0]?.title || "—" }
      ];

      let response: ApiResponse = {
        answer: matchedCompany?.description
          ? `${matchedCompany.name}についての情報です。\n\n${matchedCompany.description.substring(0, 500)}${matchedCompany.description.length > 500 ? '...' : ''}\n\n詳細は以下の参考資料をご確認ください。`
          : `${query}についてWeb検索を行いました。詳細は参考資料をご確認ください。\n\n※現在AIによる要約機能は一時的に利用できません。`,
        facts: basicFacts,
        sources: fallbackSources.slice(0, 3).map(s => ({
          url: s.url,
          title: s.title,
          published_at: s.published_at
        })),
        tokens: 0,
        took_ms: Date.now() - startTime
      };

      response = await attachEnrichment(response, matchedCompany);
      response = applyBondMetadata(response, matchedCompany, query, mode);
      return NextResponse.json(response);
    }

  } catch (error: any) {
    console.error('API error:', error?.message);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

// OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

async function attachEnrichment(response: ApiResponse, companyDoc?: any) {
  if (!companyDoc) {
    return response;
  }

  const enrichment = await buildEnrichment(companyDoc);
  if (!enrichment || Object.keys(enrichment).length === 0) {
    return response;
  }

  return {
    ...response,
    ...enrichment,
    answer: appendEnrichmentSummary(response.answer, enrichment)
  };
}

function applyBondMetadata(
  response: ApiResponse,
  companyDoc: any | undefined | null,
  query: string,
  mode: 'company' | 'person' | 'service' = 'company'
): ApiResponse {
  if (!companyDoc) {
    // DBに企業/人物データがない場合でも、クエリからslugを生成してリンクを作成
    const appUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://bond.giving';
    const generatedSlug = query.toLowerCase().replace(/\s+/g, '-');
    const pathPrefix = mode === 'person' ? 'person' : mode === 'service' ? 'service' : 'company';
    const bondPageUrl = `${appUrl}/${pathPrefix}/${encodeURIComponent(generatedSlug)}`;

    return {
      ...response,
      companyName: query,
      companySlug: generatedSlug,
      bondPageUrl
    };
  }

  const appUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://bond.giving';
  const pathPrefix = mode === 'person' ? 'person' : mode === 'service' ? 'service' : 'company';
  const bondPageUrl = `${appUrl}/${pathPrefix}/${encodeURIComponent(companyDoc.slug)}`;

  return {
    ...response,
    companySlug: companyDoc.slug,
    companyName: companyDoc.name,
    bondPageUrl
  };
}

type BondScoreStats = {
  averageRating: number;
  reviewCount: number;
};

interface UserEditedPromptContext {
  sources: Source[];
  pageContents: Array<{ url: string; content: string }>;
  facts: Fact[];
}

async function getBondScoreStats(slug?: string): Promise<BondScoreStats> {
  if (!slug) {
    return { averageRating: 0, reviewCount: 0 };
  }

  const evaluationStats = await Evaluation.aggregate([
    { $match: { companySlug: slug } },
    {
      $group: {
        _id: null,
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 }
      }
    }
  ]);

  if (!evaluationStats.length) {
    return { averageRating: 0, reviewCount: 0 };
  }

  return {
    averageRating: evaluationStats[0].avgRating || 0,
    reviewCount: evaluationStats[0].count || 0
  };
}

function buildUserEditedPromptContext(
  companyDoc: any,
  bondScore: BondScoreStats
): UserEditedPromptContext {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const companyPageUrl = `${appUrl}/company/${encodeURIComponent(companyDoc.slug)}`;
  const updatedAt =
    companyDoc?.updatedAt instanceof Date
      ? companyDoc.updatedAt.toISOString()
      : companyDoc?.updatedAt || '';

  const summaryLines = [
    `会社名: ${companyDoc.name}`,
    `業界: ${companyDoc.industry || '—'}`,
    `設立: ${companyDoc.founded || '—'}`,
    `従業員数: ${companyDoc.employees || '—'}`,
    `ウェブサイト: ${companyDoc.website || '—'}`,
    `Bondスコア平均評価: ${bondScore.averageRating.toFixed(2)} / 5`,
    `Bondレビュー数: ${bondScore.reviewCount}`,
    `Bondページ: ${companyPageUrl}`,
    updatedAt ? `最終更新: ${updatedAt}` : ''
  ].filter(Boolean);

  const descriptionSection = companyDoc.description
    ? `\n【企業説明】\n${companyDoc.description}`
    : '';

  const content = `Bondユーザー編集データ\n${summaryLines.join('\n')}${descriptionSection}`;

  const facts: Fact[] = [
    { label: "会社名", value: companyDoc.name || '—' },
    { label: "業界", value: companyDoc.industry || '—' },
    { label: "設立", value: companyDoc.founded || '—' },
    { label: "従業員数", value: companyDoc.employees || '—' },
    { label: "ウェブサイト", value: companyDoc.website || '—' },
    { label: "Bond Score", value: `${bondScore.averageRating.toFixed(2)} / 5（${bondScore.reviewCount}件）` }
  ];

  return {
    sources: [
      {
        url: companyPageUrl,
        title: `${companyDoc.name}（Bondユーザー編集データ）`,
        published_at: updatedAt || undefined,
        description: companyDoc.description?.slice(0, 200)
      }
    ],
    pageContents: [{ url: companyPageUrl, content }],
    facts
  };
}

function appendEnrichmentSummary(
  answer: string | undefined,
  enrichment?: Awaited<ReturnType<typeof buildEnrichment>>
) {
  if (!enrichment) return answer || '';

  const bullets: string[] = [];

  if (enrichment.industryInsights?.length) {
    const highlightedInsights = enrichment.industryInsights
      .filter((insight, idx) => idx < 2 || insight.label.includes('業界マルチプル'))
      .slice(0, 3)
      .map((insight) => {
        const contextText = insight.context ? `（${insight.context}）` : '';
        return `${insight.label}: ${insight.value}${contextText}`;
      });
    if (highlightedInsights.length) {
      bullets.push(`業界インサイト - ${highlightedInsights.join(' / ')}`);
    }
  }

  if (enrichment.similarCompanies?.length) {
    const similarText = enrichment.similarCompanies
      .map(
        (company) =>
          `${company.name}（⭐${company.averageRating.toFixed(1)} × ${
            company.reviewCount
          }件${company.sharedEvaluatorCount ? ` / 共通評価者${company.sharedEvaluatorCount}人` : ''}）`
      )
      .join('、 ');
    bullets.push(`類似企業: ${similarText}`);
  }

  if (enrichment.relatedPeople?.length) {
    const peopleText = enrichment.relatedPeople
      .map((person) => person.name)
      .join('、 ');
    bullets.push(`関連人物: ${peopleText}`);
  }

  if (!bullets.length) {
    return answer || '';
  }

  const base = answer?.trim();
  return `${base ? `${base}\n\n` : ''}【Bondインサイト】\n${bullets
    .map((line) => `・${line}`)
    .join('\n')}`;
}

async function searchCompaniesByQuery(query: string) {
  const slugCandidates = buildSlugCandidates(query);
  const seen = new Set<string>();
  const matches: any[] = [];

  const addMatches = (docs: any[]) => {
    for (const doc of docs) {
      if (!doc) continue;
      const id = doc._id?.toString();
      if (id && !seen.has(id)) {
        seen.add(id);
        matches.push(doc);
      }
      if (matches.length >= 8) break;
    }
  };

  if (slugCandidates.length) {
    const direct = await Company.find({ slug: { $in: slugCandidates } })
      .limit(8)
      .lean();
    addMatches(direct);
  }

  const escapedQuery = escapeRegExp(query);
  const regexMatches = await Company.find({
    name: { $regex: new RegExp(escapedQuery, 'i') }
  })
    .limit(8)
    .lean();
  addMatches(regexMatches);

  if (!matches.length) {
    const tokenRegex = slugCandidates
      .filter((candidate) => candidate.length >= 3)
      .map((candidate) => escapeRegExp(candidate))
      .join('|');

    if (tokenRegex) {
      const fuzzyMatches = await Company.find({
        $or: [
          { name: { $regex: new RegExp(tokenRegex, 'i') } },
          { slug: { $regex: new RegExp(tokenRegex.replace(/-/g, '.*'), 'i') } }
        ]
      })
        .limit(8)
        .lean();
      addMatches(fuzzyMatches);
    }
  }

  return matches;
}

function mapCompanyToCandidate(companyDoc: any) {
  // サービス概要を生成（業種 + descriptionの冒頭を要約）
  const services = companyDoc.description
    ? companyDoc.description.substring(0, 100) + (companyDoc.description.length > 100 ? '...' : '')
    : companyDoc.industry || undefined;

  return {
    slug: companyDoc.slug,
    name: companyDoc.name,
    industry: companyDoc.industry || undefined,
    description: companyDoc.description
      ? companyDoc.description.substring(0, 200)
      : undefined,
    founded: companyDoc.founded || undefined,
    headquarters: companyDoc.headquarters || companyDoc.location || undefined,
    services: services,
    ceo: companyDoc.ceo || companyDoc.representative || undefined
  };
}

function normalizeQuery(input: string) {
  return input
    .trim()
    .toLowerCase()
    .normalize('NFKC');
}

function escapeRegExp(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildSlugCandidates(query: string) {
  const normalized = normalizeQuery(query);
  const collapsed = normalized.replace(/\s+/g, '');
  const hyphenated = normalized.replace(/\s+/g, '-');
  const asciiFriendly = normalized.replace(/[^a-z0-9\u3400-\u9fff]+/g, '-');

  const tokens = normalized
    .split(/[\s、,／/・|]/)
    .map((token) => token.trim())
    .filter(Boolean);

  return Array.from(
    new Set([
      normalized,
      collapsed,
      hyphenated,
      asciiFriendly,
      ...tokens,
      ...tokens.map((token) => token.replace(/\s+/g, ''))
    ].filter(Boolean))
  );
}

type CompanyResolution =
  | { selectionRequired: true; candidates: CompanyCandidate[] }
  | { matchedCompany: any | null };

interface SearchFilters {
  categoryKeyword?: string;
  regionKeyword?: string;
}

// スコアリング関数: 企業がフィルターにどれだけマッチしているかを計算
function calculateMatchScore(company: any, filters: SearchFilters): number {
  let score = 0;
  const { categoryKeyword, regionKeyword } = filters;

  // 基本スコア（DBに存在する企業なので1点）
  score += 1;

  if (categoryKeyword) {
    const categoryLower = categoryKeyword.toLowerCase();
    const categoryTokens = categoryLower.split(/[\s,、/／・|]+/).filter(Boolean);

    // industry フィールドでマッチ
    if (company.industry) {
      const industryLower = company.industry.toLowerCase();
      for (const token of categoryTokens) {
        if (industryLower.includes(token)) {
          score += 10; // 業界マッチは高スコア
        }
      }
    }

    // category フィールドでマッチ
    if (company.category) {
      const categoryFieldLower = company.category.toLowerCase();
      for (const token of categoryTokens) {
        if (categoryFieldLower.includes(token)) {
          score += 10;
        }
      }
    }

    // description フィールドでマッチ
    if (company.description) {
      const descLower = company.description.toLowerCase();
      for (const token of categoryTokens) {
        if (descLower.includes(token)) {
          score += 5; // 説明文マッチは中スコア
        }
      }
    }

    // tags フィールドでマッチ（配列の場合）
    if (Array.isArray(company.tags)) {
      for (const tag of company.tags) {
        const tagLower = (tag || '').toLowerCase();
        for (const token of categoryTokens) {
          if (tagLower.includes(token)) {
            score += 8;
          }
        }
      }
    }
  }

  if (regionKeyword) {
    const regionLower = regionKeyword.toLowerCase();
    const regionTokens = regionLower.split(/[\s,、/／・|]+/).filter(Boolean);

    // headquarters/location フィールドでマッチ
    const location = company.headquarters || company.location || '';
    if (location) {
      const locationLower = location.toLowerCase();
      for (const token of regionTokens) {
        if (locationLower.includes(token)) {
          score += 10;
        }
      }
    }

    // market フィールドでマッチ
    if (company.market) {
      const marketLower = company.market.toLowerCase();
      for (const token of regionTokens) {
        if (marketLower.includes(token)) {
          score += 10;
        }
      }
    }

    // country フィールドでマッチ
    if (company.country) {
      const countryLower = company.country.toLowerCase();
      for (const token of regionTokens) {
        if (countryLower.includes(token)) {
          score += 10;
        }
      }
    }
  }

  return score;
}

async function resolveCompanyMatches(
  query: string,
  specificSlug?: string,
  filters: SearchFilters = {}
): Promise<CompanyResolution> {
  if (specificSlug) {
    const exact = await Company.findOne({ slug: specificSlug }).lean();
    if (exact) {
      return { matchedCompany: exact };
    }
  }

  const matches = await searchCompaniesByQuery(query);

  if (matches.length === 0) {
    return { matchedCompany: null };
  }

  if (matches.length === 1) {
    return { matchedCompany: matches[0] };
  }

  // 複数マッチの場合: スコアリングを適用
  const hasFilters = filters.categoryKeyword || filters.regionKeyword;

  if (hasFilters) {
    // スコアを計算してソート
    const scoredMatches = matches.map((company) => ({
      company,
      score: calculateMatchScore(company, filters)
    }));

    scoredMatches.sort((a, b) => b.score - a.score);

    // トップスコアが明確に高い（2位以下より2倍以上スコアが高い）場合は自動選択
    const topScore = scoredMatches[0].score;
    const secondScore = scoredMatches[1]?.score || 0;

    if (topScore > 1 && topScore >= secondScore * 2) {
      console.info(`Auto-selected company: ${scoredMatches[0].company.name} (score: ${topScore})`);
      return { matchedCompany: scoredMatches[0].company };
    }

    // スコア付きの候補を返す
    return {
      selectionRequired: true as const,
      candidates: scoredMatches.map(({ company, score }) => ({
        ...mapCompanyToCandidate(company),
        matchScore: score
      }))
    };
  }

  // フィルターがない場合は従来通り候補一覧を返す
  return {
    selectionRequired: true as const,
    candidates: matches.map(mapCompanyToCandidate)
  };
}

async function buildEnrichment(companyDoc?: any) {
  if (!companyDoc) return {};

  const slug = companyDoc.slug;
  const industry = companyDoc.industry;

  const similarCompaniesMap = new Map<
    string,
    {
      name: string;
      slug: string;
      industry?: string;
      averageRating: number;
      reviewCount: number;
      weightedScore: number;
      sharedEvaluatorCount?: number;
    }
  >();
  const industryInsights: any[] = [];
  const relatedPeople: any[] = [];

  try {
    const industryCompanies = industry
      ? await Company.find({ industry }).select('name slug industry').lean()
      : [];

    const industrySlugs = industryCompanies.map((c) => c.slug);
    if (industrySlugs.length === 0 && slug) {
      industrySlugs.push(slug);
    }

    const reviewStats = industrySlugs.length
      ? await Evaluation.aggregate([
          { $match: { companySlug: { $in: industrySlugs } } },
          {
            $group: {
              _id: '$companySlug',
              avgRating: { $avg: '$rating' },
              reviews: { $sum: 1 }
            }
          }
        ])
      : [];

    if (reviewStats.length) {
      const statsMap = new Map(reviewStats.map((stat) => [stat._id, stat]));

      const weightedList = industryCompanies
        .map((company) => {
          const stat = statsMap.get(company.slug) || { avgRating: 0, reviews: 0 };
          const avgRating = stat.avgRating || 0;
          const reviews = stat.reviews || 0;
          return {
            name: company.name,
            slug: company.slug,
            industry: company.industry,
            averageRating: avgRating,
            reviewCount: reviews,
            weightedScore: Number((avgRating * reviews).toFixed(2))
          };
        })
        .filter((item) => item.reviewCount > 0)
        .sort((a, b) => b.weightedScore - a.weightedScore);

      weightedList.forEach((item) => {
        if (item.slug === slug) return;
        similarCompaniesMap.set(item.slug, {
          name: item.name,
          slug: item.slug,
          industry: item.industry,
          averageRating: item.averageRating,
          reviewCount: item.reviewCount,
          weightedScore: item.weightedScore
        });
      });

      const avgRating =
        weightedList.reduce((sum, item) => sum + item.averageRating, 0) /
        (weightedList.length || 1);
      const avgReviews =
        weightedList.reduce((sum, item) => sum + item.reviewCount, 0) /
        (weightedList.length || 1);
      const industryMultiple = avgRating * avgReviews;

      industryInsights.push(
        {
          label: '業界平均スコア',
          value: `${avgRating.toFixed(2)}`,
          context: `${industry || '業界未分類'} (${weightedList.length}社)`
        },
        {
          label: '平均レビュー件数',
          value: `${avgReviews.toFixed(1)} 件`
        },
        {
          label: '業界マルチプル',
          value: `${industryMultiple.toFixed(1)}`,
          context: '平均スコア × 平均レビュー件数'
        }
      );

      if (weightedList.length) {
        industryInsights.push({
          label: 'トップ企業',
          value: `${weightedList[0].name} (${weightedList[0].averageRating.toFixed(
            1
          )} / ${weightedList[0].reviewCount}件)`
        });
      }
    }
  } catch (err) {
    console.warn('Error building industry insights:', err);
  }

  try {
    if (slug) {
      const sharedEvaluatorIds: string[] = (await Evaluation.distinct('userId', {
        companySlug: slug
      }))
        .map((id: any) => (typeof id === 'string' ? id : id?.toString()))
        .filter((id): id is string => Boolean(id));

      if (sharedEvaluatorIds.length) {
        const overlapStats = await Evaluation.aggregate([
          {
            $match: {
              companySlug: { $ne: slug },
              userId: { $in: sharedEvaluatorIds }
            }
          },
          {
            $group: {
              _id: '$companySlug',
              avgRating: { $avg: '$rating' },
              reviews: { $sum: 1 },
              sharedEvaluators: { $addToSet: '$userId' }
            }
          },
          {
            $project: {
              avgRating: 1,
              reviews: 1,
              sharedEvaluatorCount: { $size: '$sharedEvaluators' },
              weightedScore: { $multiply: ['$avgRating', '$reviews'] }
            }
          },
          {
            $sort: { sharedEvaluatorCount: -1, weightedScore: -1 }
          },
          { $limit: 5 }
        ]);

        if (overlapStats.length) {
          const overlapSlugs = overlapStats.map((stat) => stat._id);
          const overlapDocs = await Company.find({ slug: { $in: overlapSlugs } })
            .select('name slug industry')
            .lean();
          const overlapMap = new Map(overlapDocs.map((doc) => [doc.slug, doc]));

          overlapStats.forEach((stat) => {
            const doc = overlapMap.get(stat._id);
            similarCompaniesMap.set(stat._id, {
              name: doc?.name || stat._id,
              slug: stat._id,
              industry: doc?.industry,
              averageRating: Number(stat.avgRating?.toFixed(2) || 0),
              reviewCount: stat.reviews || 0,
              weightedScore: Number(stat.weightedScore?.toFixed(2) || 0),
              sharedEvaluatorCount: stat.sharedEvaluatorCount || 0
            });
          });
        }
      }
    }
  } catch (err) {
    console.warn('Error building evaluator overlaps:', err);
  }

  try {
    if (slug) {
      const topEvaluations = await Evaluation.find({ companySlug: slug })
        .sort({ rating: -1, createdAt: -1 })
        .limit(10)
        .lean();

      if (topEvaluations.length) {
        const userIds = topEvaluations
          .map((evaluation) => evaluation.userId)
          .filter((id): id is string => !!id && mongoose.Types.ObjectId.isValid(id))
          .map((id) => new mongoose.Types.ObjectId(id));

        const users = userIds.length
          ? await User.find({ _id: { $in: userIds } })
              .select('name company role email')
              .lean()
          : [];

        const userMap = new Map(users.map((user) => [user._id.toString(), user]));

        topEvaluations.forEach((evaluation) => {
          const user = userMap.get(evaluation.userId);
          if (!user) return;
          if (relatedPeople.find((person) => person.name === user.name)) return;

          relatedPeople.push({
            name: user.name || 'Bondユーザー',
            role: user.role || 'member',
            company: user.company,
            relation: `評価 ${evaluation.rating.toFixed(1)}`,
            profileSlug: inferProfileSlug(user)
          });
        });
      }
    }
  } catch (err) {
    console.warn('Error building related people:', err);
  }

  const similarCompanies = Array.from(similarCompaniesMap.values())
    .filter((item) => item.slug !== slug && item.reviewCount > 0)
    .sort((a, b) => {
      const sharedDiff = (b.sharedEvaluatorCount || 0) - (a.sharedEvaluatorCount || 0);
      if (sharedDiff !== 0) return sharedDiff;
      return b.weightedScore - a.weightedScore;
    })
    .slice(0, 3);

  return {
    similarCompanies: similarCompanies.length ? similarCompanies : undefined,
    industryInsights: industryInsights.length ? industryInsights : undefined,
    relatedPeople: relatedPeople.length ? relatedPeople.slice(0, 5) : undefined
  };
}

function inferProfileSlug(user: any) {
  if (!user) return undefined;

  if (user.email === 'tomura@hackjpn.com') return 'tomura';
  if (user.email === 'team@hackjpn.com') return 'team';
  if (user.name && user.name.toLowerCase().includes('hikaru')) return 'hikaru';

  if (user.email) {
    return user.email.split('@')[0];
  }

  if (user.name) {
    return user.name
      .trim()
      .toLowerCase()
      .normalize('NFKC')
      .replace(/[^a-z0-9\u3400-\u9fff]+/g, '-')
      .replace(/-{2,}/g, '-')
      .replace(/^-|-$/g, '');
  }

  return undefined;
}
