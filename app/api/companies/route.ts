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
        name: 'ギグー',
        slug: 'tech-innovate',
        description: '革新的なAI技術で未来を創造するスタートアップ',
        logoUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9InVybCgjZ3JhZGllbnQwX2xpbmVhcl8xXzEpIi8+CjxwYXRoIGQ9Ik0yMC4yIDQ2VjE4LjhIMjcuNlYyMC44SDIyLjJWMzAuNkgyNi44VjMyLjZIMjIuMlY0NEgyOFY0NkgyMC4yWk0zNi42IDQ2VjE4LjhINDIuMkM0My43MzMzIDE4LjggNDQuOTMzMyAxOS4yIDQ1LjggMjAuMkM0Ni42NjY3IDIxLjIgNDcuMSAyMi40NjY3IDQ3LjEgMjRDNDcuMSAyNS41MzMzIDQ2LjY2NjcgMjYuOCA0NS44IDI3LjhDNDQuOTMzMyAyOC44IDQzLjczMzMgMjkuMiA0Mi4yIDI5LjJIMzguNlY0NkgzNi42Wk0zOC42IDI3LjJINDIuMkM0Mi44NjY3IDI3LjIgNDMuMzMzMyAyNi45MzMzIDQzLjYgMjYuNEM0My44NjY3IDI1Ljg2NjcgNDQgMjUuMiA0NCAyNC40Qzc0NCAyMy43MzMzIDQzLjg2NjcgMjMuMiA0My42IDIyLjhDNDMuMzMzMyAyMi40IDQyLjg2NjcgMjIuMiA0Mi4yIDIyLjJIMzguNlYyNy4yWiIgZmlsbD0id2hpdGUiLz4KPGRlZnM+CjxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZGllbnQwX2xpbmVhcl8xXzEiIHgxPSIwIiB5MT0iMCIgeDI9IjY0IiB5Mj0iNjQiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iIzMzNzVGRiIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM2MzY2RjEiLz4KPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8L3N2Zz4K',
        website: 'https://techinnovate.com',
        industry: 'AI・機械学習',
        foundedYear: 2023,
        location: '東京',
        employees: 25,
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
        name: 'DigitalSolutions',
        slug: 'digital-solutions',
        description: 'デジタル変革を支援するコンサルティング企業',
        logoUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9InVybCgjZ3JhZGllbnQwX2xpbmVhcl8yXzIpIi8+CjxwYXRoIGQ9Ik0yMC4yIDQ2VjE4LjhIMjcuNEMyOC4yNjY3IDE4LjggMjkuMDMzMyAxOS4wMzMzIDI5LjcgMTkuNUMzMC4zNjY3IDIwIDMwLjcgMjAuNjMzMyAzMC43IDIxLjRDMzAuNyAyMi4yIDMwLjM2NjcgMjIuODMzMyAyOS43IDIzLjNDMjkuMDMzMyAyMy43NjY3IDI4LjI2NjcgMjQgMjcuNCAyNEgyMi4yVjI4LjhIMjguNFYzMC44SDIyLjJWNDZIMjAuMlpNMjIuMiAyMi4ySDI3LjRDMjcuOCAyMi4yIDI4LjEgMjIgMjguMyAyMS42QzI4LjUgMjEuMiAyOC42IDIwLjggMjguNiAyMC40QzI4LjYgMjAgMjguNSAxOS42IDI4LjMgMTkuMkMyOC4xIDE4LjggMjcuOCAxOC42IDI3LjQgMTguNkgyMi4yVjIyLjJaIiBmaWxsPSJ3aGl0ZSIvPgo8ZGVmcz4KPGxpbmVhckdyYWRpZW50IGlkPSJncmFkaWVudDBfbGluZWFyXzJfMiIgeDE9IjAiIHkxPSIwIiB4Mj0iNjQiIHkyPSI2NCIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBzdG9wLWNvbG9yPSIjMTBCOTgxIi8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzVCQzE4QSIvPgo8L2xpbmVhckdyYWRpZW50Pgo8L2RlZnM+Cjwvc3ZnPgo=',
        website: 'https://digitalsolutions.jp',
        industry: 'コンサルティング',
        foundedYear: 2022,
        location: '大阪',
        employees: 40,
        trust: {
          total: 4.5,
          byRole: {
            'Employee': 4.6,
            'Customer': 4.4,
            'Advisor': 4.5
          }
        },
        grade: 'A' as const,
        createdAt: new Date('2024-02-10')
      },
      {
        _id: '3',
        name: 'StartupHub',
        slug: 'startup-hub',
        description: 'スタートアップ支援プラットフォーム',
        logoUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9InVybCgjZ3JhZGllbnQwX2xpbmVhcl8zXzMpIi8+CjxwYXRoIGQ9Ik0yMC4yIDQ2VjE4LjhIMjdWMjAuOEgyMi4yVjMwLjZIMjdWMzIuNkgyMi4yVjQ0SDI3LjhWNDZIMjAuMlpNMzQuNiA0NlYxOC44SDM2LjZWMjguNkg0MS44VjE4LjhINDMuOFY0Nkg0MS44VjMwLjZIMzYuNlY0NkgzNC42WiIgZmlsbD0id2hpdGUiLz4KPGRlZnM+CjxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZGllbnQwX2xpbmVhcl8zXzMiIHgxPSIwIiB5MT0iMCIgeDI9IjY0IiB5Mj0iNjQiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iI0Y1OUUwQiIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNGQjkyMzciLz4KPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8L3N2Zz4K',
        website: 'https://startuphub.co.jp',
        industry: 'プラットフォーム',
        foundedYear: 2024,
        location: '東京',
        employees: 15,
        trust: {
          total: 4.7,
          byRole: {
            'Founder': 5.0,
            'Investor': 4.5,
            'Fan': 4.6
          }
        },
        grade: 'A' as const,
        createdAt: new Date('2024-03-05')
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