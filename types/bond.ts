export interface Fact {
  label: string;
  value: string;
}

export interface Source {
  url: string;
  title: string;
  published_at?: string;
  description?: string;
  domain?: string;
}

export interface ApiRequest {
  query: string;
  mode: 'company' | 'person';
  history?: Array<{ role: string; content: string }>;
  companySlug?: string;
  // 絞り込み用の追加フィールド
  categoryKeyword?: string;  // 例: "医療系スタートアップ", "SaaS", "ヘルスケア"
  regionKeyword?: string;    // 例: "日本", "米国", "東証グロース"
}

export interface SimilarCompany {
  name: string
  slug: string
  industry?: string
  averageRating: number
  reviewCount: number
  weightedScore: number
  sharedEvaluatorCount?: number
}

export interface IndustryInsight {
  label: string
  value: string
  context?: string
}

export interface RelatedPerson {
  name: string
  role?: string
  company?: string
  relation: string
  profileSlug?: string
}

export interface ApiResponse {
  answer: string;
  facts: Fact[];
  sources: Source[];
  tokens: number;
  took_ms: number;
  similarCompanies?: SimilarCompany[];
  industryInsights?: IndustryInsight[];
  relatedPeople?: RelatedPerson[];
  companySlug?: string;
  companyName?: string;
  bondPageUrl?: string;
  selectionRequired?: boolean;
  candidates?: CompanyCandidate[];
}

export interface CompanyCandidate {
  slug: string;
  name: string;
  industry?: string;
  description?: string;
  founded?: string;
  headquarters?: string;
  services?: string;
  ceo?: string;
  matchScore?: number;  // 検索条件とのマッチ度スコア
}

export type CompanySearchResultType = 'not_found' | 'single' | 'multiple';

export interface CompanySearchResponse {
  type: CompanySearchResultType;
  company?: CompanyCandidate;
  companies?: CompanyCandidate[];
}

export interface SearchWebResult {
  organic?: Array<{
    title: string;
    link: string;
    snippet?: string;
    date?: string;
  }>;
  news?: Array<{
    title: string;
    link: string;
    snippet?: string;
    date?: string;
  }>;
}
