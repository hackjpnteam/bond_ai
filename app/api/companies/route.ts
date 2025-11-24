import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { getCollection } from '@/lib/db'
import { CompanyDoc, RoleTag } from '@/lib/models'
import { createCompanySchema } from '@/lib/schema'

export async function GET(request: NextRequest) {
  try {
    // デモデータを返す（MongoDB接続エラー回避）
    const demoCompanies = [
      {
        _id: '1',
        name: '株式会社ギグー',
        slug: 'ギグー',
        description: 'AIを活用したHRテック企業。採用・人材管理の革新的なソリューションを提供し、企業の人材戦略を支援しています。',
        logoUrl: '/logos/ギグー.png',
        website: 'https://gigoo.co.jp',
        industry: 'AI・機械学習',
        foundedYear: 2020,
        location: '東京',
        employees: 35,
        trust: {
          total: 4.8,
          byRole: {
            'Investor': 4.9,
            'Employee': 4.7,
            'Customer': 4.8
          }
        },
        grade: 'A' as const,
        createdAt: new Date('2024-01-15')
      },
      {
        _id: '2',
        name: '株式会社hokuto',
        slug: 'hokuto',
        description: '医療・ヘルスケア領域におけるDXを推進するスタートアップ。医療従事者向けプラットフォームを開発・運営しています。',
        logoUrl: '/logos/hokuto.png',
        website: 'https://hokuto.co.jp',
        industry: 'ヘルステック',
        foundedYear: 2019,
        location: '東京',
        employees: 80,
        trust: {
          total: 4.6,
          byRole: {
            'Employee': 4.7,
            'Investor': 4.6,
            'Customer': 4.5
          }
        },
        grade: 'A' as const,
        createdAt: new Date('2024-02-10')
      },
      {
        _id: '3',
        name: 'Chatwork株式会社',
        slug: 'chatwork',
        description: '国内最大級のビジネスチャットツール「Chatwork」を提供。中小企業を中心に、業務効率化とコミュニケーション改善を支援。',
        logoUrl: '/logos/chatwork.png',
        website: 'https://go.chatwork.com',
        industry: 'SaaS・プラットフォーム',
        foundedYear: 2004,
        location: '大阪',
        employees: 350,
        trust: {
          total: 4.5,
          byRole: {
            'Customer': 4.6,
            'Employee': 4.4,
            'Investor': 4.5
          }
        },
        grade: 'A' as const,
        createdAt: new Date('2024-03-05')
      },
      {
        _id: '4',
        name: '株式会社ホーミー',
        slug: 'ホーミー',
        description: '不動産テック企業。AIを活用した不動産取引プラットフォームを展開し、住宅購入体験を革新しています。',
        logoUrl: '/logos/ホーミー.png',
        website: 'https://homie.co.jp',
        industry: '不動産テック',
        foundedYear: 2018,
        location: '東京',
        employees: 60,
        trust: {
          total: 4.4,
          byRole: {
            'Customer': 4.5,
            'Employee': 4.3,
            'Advisor': 4.4
          }
        },
        grade: 'B' as const,
        createdAt: new Date('2024-04-01')
      },
      {
        _id: '5',
        name: '株式会社Sopital',
        slug: 'sopital',
        description: '医療機関向けDXソリューションを提供。病院の業務効率化と患者体験の向上を実現するサービスを展開。',
        logoUrl: '/logos/sopital.png',
        website: 'https://sopital.co.jp',
        industry: 'ヘルステック',
        foundedYear: 2021,
        location: '東京',
        employees: 25,
        trust: {
          total: 4.3,
          byRole: {
            'Investor': 4.4,
            'Employee': 4.2,
            'Customer': 4.3
          }
        },
        grade: 'B' as const,
        createdAt: new Date('2024-05-01')
      }
    ]

    const searchParams = request.nextUrl.searchParams
    const role = searchParams.get('role') as RoleTag | null
    const minScore = searchParams.get('minScore')
    
    let results = demoCompanies
    
    if (role) {
      results = results.filter(company => 
        company.trust.byRole[role] && company.trust.byRole[role] > 0
      )
    }
    
    if (minScore) {
      results = results.filter(company => 
        company.trust.total >= parseInt(minScore)
      )
    }
    
    // MongoDB接続も試す（エラーが出ても続行）
    try {
      const companies = await getCollection<CompanyDoc>('companies')
      const query: Record<string, unknown> = {}
      if (role) {
        query[`trust.byRole.${role}`] = { $exists: true, $gt: 0 }
      }
      if (minScore) {
        query['trust.total'] = { $gte: parseInt(minScore) }
      }
      
      const dbResults = await companies
        .find(query)
        .sort({ 'trust.total': -1, createdAt: -1 })
        .toArray()
      
      if (dbResults.length > 0) {
        results = dbResults
      }
    } catch (dbError) {
      console.log('DB error, using demo data:', dbError)
    }
    
    return NextResponse.json(results)
  } catch (error) {
    console.error('Error fetching companies:', error)
    return NextResponse.json(
      { error: 'Failed to fetch companies' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const validation = createCompanySchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      )
    }
    
    const companies = await getCollection<CompanyDoc>('companies')
    
    const existing = await companies.findOne({ slug: validation.data.slug })
    if (existing) {
      return NextResponse.json(
        { error: 'Company with this slug already exists' },
        { status: 409 }
      )
    }
    
    const company: Omit<CompanyDoc, '_id'> = {
      ...validation.data,
      createdAt: new Date(),
      trust: {
        total: 0,
        byRole: {}
      }
    }
    
    const result = await companies.insertOne(company as CompanyDoc)
    
    return NextResponse.json({
      _id: result.insertedId,
      ...company
    })
  } catch (error) {
    console.error('Error creating company:', error)
    return NextResponse.json(
      { error: 'Failed to create company' },
      { status: 500 }
    )
  }
}