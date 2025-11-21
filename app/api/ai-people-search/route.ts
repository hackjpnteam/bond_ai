import { NextRequest, NextResponse } from 'next/server'

interface BondProfile {
  id: string
  name: string
  title: string
  company: string
  summary: string
  link?: string
  commonPoint: string
  source: 'Bond Network'
  trustScore: number
  review?: {
    by: string
    comment: string
    rating: number
  }
  connectionPath?: string[]
}

interface PublicProfile {
  name: string
  title: string
  company: string
  summary: string
  link: string
  commonPoint: string
  source: 'Public Network'
  platform: 'LinkedIn' | 'Wantedly' | 'X' | 'GitHub' | 'Other'
  confidence: number
}

type Profile = BondProfile | PublicProfile

// Mock Bond Network data - in production this would come from your database
const mockBondProfiles: BondProfile[] = [
  {
    id: '1',
    name: '山田太郎',
    title: 'Senior Software Engineer',
    company: 'Google Japan',
    summary: '検索AIのバックエンド開発に従事。機械学習とスケーラブルシステム設計が専門。',
    link: 'https://bond.ai/profile/yamada-taro',
    commonPoint: 'AIスタートアップでの開発経験があり、同じ技術的課題に直面しています。',
    source: 'Bond Network',
    trustScore: 4.8,
    review: {
      by: '佐藤花子',
      comment: 'チームを支えるリーダーシップが素晴らしく、技術力も申し分ありません。ぜひ紹介したい人物です。',
      rating: 5
    },
    connectionPath: ['佐藤花子', '山田太郎']
  },
  {
    id: '2',
    name: '鈴木一郎',
    title: 'Product Manager',
    company: 'Google Cloud',
    summary: 'Enterprise AI製品の戦略立案と実行を担当。B2Bサービスの成長に注力。',
    link: 'https://bond.ai/profile/suzuki-ichiro',
    commonPoint: 'プロダクト戦略とAI技術の組み合わせに強い関心を持っています。',
    source: 'Bond Network',
    trustScore: 4.6,
    review: {
      by: '田中次郎',
      comment: '戦略的思考力が高く、技術とビジネスの橋渡しが得意です。',
      rating: 5
    },
    connectionPath: ['田中次郎', '鈴木一郎']
  }
]

async function generatePublicProfiles(company: string, userInterests: string[]): Promise<PublicProfile[]> {
  // In production, this would use Claude API to generate realistic profiles
  // based on public web data and SERP API results
  
  const systemPrompt = `あなたは「Bond Connect」のAIルート提案エンジンです。

ユーザーが入力した企業名「${company}」に基づき、Public Network（Bond外の公開Web情報）から候補者を探し、JSONを生成してください。

以下の条件を満たしてください：
- 各人物データには "source": "Public Network" を付与
- LinkedIn / Wantedly / X / GitHub の公開情報をもとに抽出
- 非公開情報や個人連絡先は含めない
- ユーザーの興味分野（${userInterests.join(', ')}）との共通点を明示
- 実在性を重視し、リアルな人物像を生成

出力は以下のフォーマットに従ってください：
{
  "name": "名前",
  "title": "役職 @ 企業名",
  "company": "企業名",
  "summary": "経歴と専門分野の要約",
  "link": "https://linkedin.com/in/...",
  "commonPoint": "ユーザーとの共通点",
  "source": "Public Network",
  "platform": "LinkedIn",
  "confidence": 0.8
}`

  // Mock AI-generated profiles for demonstration
  const mockPublicProfiles: PublicProfile[] = [
    {
      name: 'John Tanaka',
      title: 'Product Manager @ Google Singapore',
      company: 'Google Singapore',
      summary: '生成AIのプロダクト統合を担当。スタートアップ出身でB2C製品の成長経験豊富。',
      link: 'https://linkedin.com/in/john-tanaka-google',
      commonPoint: 'AI×UX設計とプロダクト成長戦略に強い興味を持っています。',
      source: 'Public Network',
      platform: 'LinkedIn',
      confidence: 0.85
    },
    {
      name: 'Sarah Kim',
      title: 'Machine Learning Engineer @ Google DeepMind',
      company: 'Google DeepMind',
      summary: '大規模言語モデルの研究開発に従事。Ph.D in Computer Science。',
      link: 'https://linkedin.com/in/sarah-kim-deepmind',
      commonPoint: '機械学習の研究と実用化のギャップに関心があります。',
      source: 'Public Network',
      platform: 'LinkedIn',
      confidence: 0.90
    },
    {
      name: 'Alex Rodriguez',
      title: 'Engineering Manager @ Google Cloud',
      company: 'Google Cloud',
      summary: 'クラウドインフラとDevOpsの専門家。大規模システムの運用経験10年以上。',
      link: 'https://linkedin.com/in/alex-rodriguez-gcp',
      commonPoint: 'スケーラブルなシステム設計とチーム管理に興味があります。',
      source: 'Public Network',
      platform: 'LinkedIn',
      confidence: 0.75
    }
  ]

  return mockPublicProfiles
}

function getBondNetworkProfiles(company: string): BondProfile[] {
  // Filter mock data by company
  return mockBondProfiles.filter(profile => 
    profile.company.toLowerCase().includes(company.toLowerCase())
  )
}

function calculateRelevanceScore(profile: Profile, userQuery: string): number {
  let score = 0
  
  // Company match
  if (profile.company.toLowerCase().includes(userQuery.toLowerCase())) {
    score += 0.3
  }
  
  // Title relevance
  if (profile.title.toLowerCase().includes('engineer') || 
      profile.title.toLowerCase().includes('manager') || 
      profile.title.toLowerCase().includes('director')) {
    score += 0.2
  }
  
  // Bond Network gets priority boost
  if (profile.source === 'Bond Network') {
    score += 0.3
    // Additional boost for high trust score
    if ('trustScore' in profile && profile.trustScore >= 4.5) {
      score += 0.2
    }
  }
  
  return Math.min(score, 1.0)
}

export async function POST(request: NextRequest) {
  try {
    const { company, userInterests = [], userQuery = '' } = await request.json()
    
    if (!company) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 })
    }

    // Get Bond Network profiles (highest priority)
    const bondProfiles = getBondNetworkProfiles(company)
    
    // Generate Public Network profiles using AI
    const publicProfiles = await generatePublicProfiles(company, userInterests)
    
    // Combine and sort by relevance
    const allProfiles: Profile[] = [...bondProfiles, ...publicProfiles]
    
    // Calculate relevance scores and sort
    const profilesWithScores = allProfiles.map(profile => ({
      ...profile,
      relevanceScore: calculateRelevanceScore(profile, userQuery || company)
    }))
    
    // Sort: Bond Network first, then by relevance score
    profilesWithScores.sort((a, b) => {
      // Bond Network always comes first
      if (a.source === 'Bond Network' && b.source !== 'Bond Network') return -1
      if (a.source !== 'Bond Network' && b.source === 'Bond Network') return 1
      
      // Within same source, sort by relevance score
      return b.relevanceScore - a.relevanceScore
    })

    const analysis = {
      totalProfiles: allProfiles.length,
      bondNetworkCount: bondProfiles.length,
      publicNetworkCount: publicProfiles.length,
      avgTrustScore: bondProfiles.length > 0 
        ? bondProfiles.reduce((sum, p) => sum + p.trustScore, 0) / bondProfiles.length 
        : 0,
      searchStrategy: bondProfiles.length > 0 
        ? 'hybrid' // Bond + AI探索
        : 'ai_only' // AI探索のみ
    }

    return NextResponse.json({
      success: true,
      company,
      profiles: profilesWithScores,
      analysis,
      message: bondProfiles.length > 0 
        ? `🟢 あなたのBondネットワーク内で${bondProfiles.length}人見つかりました + AI探索で${publicProfiles.length}人の候補を発見`
        : `🔵 AIがBond外から${publicProfiles.length}人の候補を見つけました`
    })

  } catch (error) {
    console.error('Error in AI people search:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'AI People Search API',
    endpoints: {
      'POST /api/ai-people-search': 'Search for people using Bond Network + AI exploration'
    },
    example: {
      company: 'Google',
      userInterests: ['AI', 'Product Management', 'Startups'],
      userQuery: 'AI product manager'
    }
  })
}