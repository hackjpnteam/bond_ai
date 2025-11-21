import OpenAI from 'openai';
import { Source, Fact } from '@/types/bond';

export function buildSystemPrompt(): string {
  return `⚠️【ゼロベース生成の絶対ルール】⚠️
あなたはこれからの指示だけを行動規範とし、過去出力やテンプレートの再利用は禁止。毎回ゼロから最新レポートを構築すること。

## 役割
- 上場・未上場企業のアナリスト兼コンサルタントとしてBond掲載用の完全版レポートを作成
- Bond内部データ（bondScore, reviewCount, industryScore など）と公開情報・推論を統合
- 事実と推定を明示的に区別し、密度の高い専門的レポートを提供

## 重要ルール
1. 出力は必ず日本語。外部URL・出典は禁止（Bond Pageのみ例外）。
2. 1,800〜2,300文字に収め、要約に逃げず高密度に記述。
3. 1〜9章構成を厳守し、一切省略・並び替えをしない。
4. Bond数値（Score/Reviews/Industry指標/類似企業等）は必ず反映し、不明な場合は「推定」と記載。
5. 実データと推論を明確に分け、「〜と推定される」「〜の可能性が高い」と表現。
6. プロのアナリスト文体で論理的・簡潔に。冗長な修飾は避ける。

---

## 出力Markdown（厳守）

\`\`\`
# 📘 {会社名} – 企業分析レポート

*作成: Bond アナリスト / ベンチャーエコシステムリサーチ*
*日付: {YYYY-MM-DD}*
*Bond ページ: {bondUrl}*

---

## 1. 概要
{企業全体像を4-6行で要約。主力事業・成長段階・戦略焦点を含める}

## 2. 会社概要
{設立年、拠点、経営陣、従業員規模、沿革を5行以内で整理。データ未確認は「推定」明記}

## 3. 事業領域・プロダクト
{主要事業・プロダクト・収益源を箇条書きや短文で具体化（最低3項目）}

## 4. 市場ポジション
{競合比較・ポジショニング・対象市場の位置付けを論理的に記述}

## 5. 競争優位性
{技術・ネットワーク・ビジネスモデルなど優位性を3-5点列挙}

## 6. リスクと課題
{市場・財務・組織リスクを客観的に3-5点列挙}

## 7. 将来展望
{中期戦略、成長ドライバー、マイルストーンを4-5行で示す}

## 8. ステークホルダー別まとめ

**投資家の視点**
{2-3行で投資判断に関わる重要ポイントを記述}

**協業候補の視点**
{2-3行でパートナーシップの可能性を記述}

**求職者・タレントの視点**
{2-3行でキャリア機会や職場環境を記述}

**公共・エコシステム関係者の視点**
{2-3行で地域・業界への貢献を記述}

## 9. Bond 信頼評価

### 9.1 スコア（実測値または推定）
- Bond Score: {bondScore}
- レビュー数: {reviewCount}
- 業界平均スコア: {industryScore}
- 業界平均レビュー数: {industryReviewAvg}
- 類似企業: {similarCompanies}

### 9.2 評価の根拠
{Bondデータと外部推論を結合し、定量＋定性の根拠を4-5行で記述}

### 9.3 推薦者ネットワーク
{Bond内で想定される推薦者層や交差関係を3行で推定}

### 9.4 リスクシグナル
{スコア変動・レビュー偏り・事業構造から導く潜在リスクを3行}

### 9.5 総合評価
{Bond指標に基づく最終判断を3-4行で結論}
\`\`\`

---

## 出力フォーマット
\`\`\`json
{
  "answer": "{上記Markdown全文（1,800〜2,300文字）}",
  "facts": [
    {"label": "会社名", "value": "..."},
    {"label": "業界", "value": "..."},
    {"label": "設立", "value": "..."},
    {"label": "所在地", "value": "..."},
    {"label": "代表者", "value": "..."},
    {"label": "従業員数", "value": "..."},
    {"label": "主要事業", "value": "..."},
    {"label": "Bond Score", "value": "..."}
  ],
  "sources": "{入力ソースをそのまま返す}"
}
\`\`\`

answerには必ず上記Markdown構造を完全準拠で含め、文字数要件を満たすこと。`;
}

export function buildUserPrompt(
  query: string,
  mode: 'company' | 'person',
  sources: Source[],
  pageContents: Map<string, string>
): string {
  const modeLabel = mode === 'company' ? '会社' : '人物';
  
  let prompt = `次の${modeLabel}について調査してください: ${query}\n\n`;
  
  prompt += '## 収集したWebソース\n';
  sources.forEach((source, i) => {
    prompt += `${i + 1}. ${source.title}\n`;
    prompt += `   URL: ${source.url}\n`;
    if (source.published_at) {
      prompt += `   日付: ${source.published_at}\n`;
    }
    prompt += '\n';
  });
  
  prompt += '\n## 各ページの内容\n';
  sources.forEach((source, i) => {
    const content = pageContents.get(source.url);
    if (content) {
      prompt += `\n### ソース${i + 1}: ${source.title}\n`;
      prompt += content.substring(0, 8000) + '\n';
    }
  });
  
  prompt += '\n上記の情報を元に、指定された形式のJSONで回答してください。';
  
  return prompt;
}

export function extractJsonFromResponse(text: string): any {
  // Remove markdown code blocks if present
  let cleanText = text;

  // Remove ```json...``` or ```...``` blocks
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    cleanText = codeBlockMatch[1].trim();
  }

  // Try to find JSON in the response
  const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.warn('No JSON found in response, returning fallback');
    return {
      answer: text || "情報を取得しました。",
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

  try {
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    // Extract content more carefully for incomplete JSON
    try {
      // Try to extract just the answer if JSON is malformed
      const answerMatch = text.match(/"answer"\s*:\s*"([^"]+)"/);
      const answer = answerMatch ? answerMatch[1] : text.substring(0, 500);
      
      console.warn('Using fallback due to malformed JSON');
      return {
        answer: answer,
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
    } catch (fallbackError) {
      console.error('Failed to parse JSON:', e);
      console.error('Original text:', text.substring(0, 500));
      
      // Return a fallback structure with the raw text
      return {
        answer: text.substring(0, 500) || "情報を取得しました。",
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
  }
}

type BondScoreSnapshot = {
  averageRating: number;
  reviewCount: number;
} | null;

interface FallbackCompanyContext {
  name?: string;
  slug?: string;
  industry?: string;
  founded?: string;
  employees?: string;
  description?: string;
  website?: string;
  headquarters?: string;
}

interface BuildFallbackParams {
  query: string;
  openai: OpenAI;
  company?: FallbackCompanyContext | null;
  bondStats?: BondScoreSnapshot;
  fallbackSources?: Source[];
  preferredFacts?: Fact[] | null;
  model?: string;
}

export async function buildFallbackResponse({
  query,
  openai,
  company,
  bondStats,
  fallbackSources = [],
  preferredFacts,
  model = 'gpt-4o-mini'
}: BuildFallbackParams): Promise<{
  answer: string;
  facts: Fact[];
  sources: Source[];
  tokens: number;
}> {
  const companyName = company?.name || query;
  const stats = bondStats || { averageRating: 0, reviewCount: 0 };
  const bondPageUrl =
    company?.slug
      ? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/company/${encodeURIComponent(company.slug)}`
      : 'Bond Page: 未登録';

  const contextLines = [
    `会社名: ${companyName}`,
    `検索クエリ: ${query}`,
    '',
    '【Bond内部データ（推定用）】',
    `- Bond Score: ${stats.averageRating ? stats.averageRating.toFixed(2) : '推定'}`,
    `- Reviews: ${stats.reviewCount || '推定'}`,
    `- Industry: ${company?.industry || '不明（推定）'}`,
    `- Founded: ${company?.founded || '不明（推定）'}`,
    `- Employees: ${company?.employees || '不明（推定）'}`,
    `- Website: ${company?.website || '不明'}`,
    `- Bond Page: ${company?.slug ? bondPageUrl : '未登録'}`
  ];

  if (company?.description) {
    contextLines.push('', '【Bondカタログ記述】', company.description);
  }

  if (fallbackSources.length) {
    contextLines.push('', '【参考ソース（最大3件）】');
    fallbackSources.slice(0, 3).forEach((source, index) => {
      contextLines.push(
        `${index + 1}. ${source.title}`,
        `   URL: ${source.url}`,
        source.description ? `   概要: ${source.description}` : ''
      );
    });
  }

  const systemPrompt = buildSystemPrompt();
  const userPrompt = contextLines.filter(Boolean).join('\n');

  const completion = await openai.chat.completions.create({
    model,
    max_tokens: 1200,
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

  const parsed = extractJsonFromResponse(responseText);
  const defaultFacts = preferredFacts && preferredFacts.length > 0
    ? preferredFacts
    : buildDefaultFacts(companyName, company, stats);

  return {
    answer: parsed.answer || `${companyName}についてのアナリストレポートを生成しました。`,
    facts: Array.isArray(parsed.facts) && parsed.facts.length > 0 ? parsed.facts : defaultFacts,
    sources: fallbackSources.slice(0, 3).map(s => ({
      url: s.url,
      title: s.title,
      published_at: s.published_at || undefined
    })),
    tokens: (completion.usage?.prompt_tokens || 0) + (completion.usage?.completion_tokens || 0)
  };
}

function buildDefaultFacts(
  companyName: string,
  company?: FallbackCompanyContext | null,
  stats?: BondScoreSnapshot
): Fact[] {
  return [
    { label: "会社名", value: companyName },
    { label: "業界", value: company?.industry || '—' },
    { label: "設立", value: company?.founded || '—' },
    { label: "所在地", value: company?.headquarters || '—' },
    { label: "代表者", value: '—' },
    { label: "従業員数", value: company?.employees || '—' },
    { label: "主要事業", value: company?.description ? company.description.slice(0, 120) + '…' : '—' },
    { label: "Bond Score", value: stats ? `${stats.averageRating?.toFixed(2)} / 5（${stats.reviewCount || 0}件）` : '—' }
  ];
}
