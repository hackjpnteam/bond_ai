import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/db'
import { CompanyDoc } from '@/lib/models'
import { requireAuth } from '@/lib/auth-middleware'
import connectDB from '@/lib/mongodb'
import Company from '@/models/Company'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // デモデータ（廃止予定 - MongoDBデータを優先使用）
    const legacyDemoCompanies: Record<string, any> = {
      'legacy-tech-innovate': {
        _id: '1',
        name: 'Legacy Demo Company',
        slug: 'legacy-tech-innovate',
        description: 'This is legacy demo data that should not be used',
        logoUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTIwIiByeD0iMjQiIGZpbGw9InVybCgjZ3JhZGllbnQwX2xpbmVhcl8xXzEpIi8+CjxwYXRoIGQ9Ik00MCA4NlYzNkg1Mkg0MFY2MUg1MVY2NUg0MFY4Mkg1MlY4Nkg0MFpNNjggODZWMzZINzlDODEuMiAzNiA4Mi44IDM2LjggODQgMzhDODUuMiAzOS4yIDg2IDQwLjggODYgNDNDODYgNDUuMiA4NS4yIDQ2LjggODQgNDhDODIuOCA0OS4yIDgxLjIgNTAgNzkgNTBINzJWODZINjhaTTcyIDQ2SDc5Qzc5LjcgNDYgODAuMiA0NS43IDgwLjUgNDVDODAuOCA0NC4zIDgxIDQzLjcgODEgNDNDODEgNDIuMyA4MC44IDQxLjcgODAuNSA0MUM4MC4yIDQwLjMgNzkuNyA0MCA3OSA0MEg3MlY0NloiIGZpbGw9IndoaXRlIi8+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9ImdyYWRpZW50MF9saW5lYXJfMV8xIiB4MT0iMCIgeTE9IjAiIHgyPSIxMjAiIHkyPSIxMjAiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iIzMzNzVGRiIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM2MzY2RjEiLz4KPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8L3N2Zz4K',
        website: 'https://techinnovate.com',
        industry: 'AI・機械学習',
        foundedYear: 2023,
        location: '東京都渋谷区',
        employees: 25,
        funding: '5億円',
        mission: 'AIの力で世界をより良い場所にする',
        vision: '2030年までにAI技術のグローバルリーダーになる',
        values: ['イノベーション', '透明性', '社会貢献'],
        trust: {
          total: 4.8,
          byRole: {
            'Investor': 4.9,
            'Employee': 4.7,
            'Customer': 4.8
          }
        },
        grade: 'A' as const,
        socialLinks: {
          twitter: 'https://twitter.com/techinnovate',
          linkedin: 'https://linkedin.com/company/techinnovate',
          github: 'https://github.com/techinnovate'
        },
        createdAt: new Date('2024-01-15')
      },
      'digital-solutions': {
        _id: '2',
        name: 'DigitalSolutions',
        slug: 'digital-solutions',
        description: 'デジタル変革を支援するコンサルティング企業。企業のDXを包括的にサポートし、持続可能な成長を実現します。',
        logoUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTIwIiByeD0iMjQiIGZpbGw9InVybCgjZ3JhZGllbnQwX2xpbmVhcl8yXzIpIi8+CjxwYXRoIGQ9Ik00MCA4NlYzNkg1M0M1NC41IDM2IDU1LjcgMzYuNSA1Ni42IDM3LjVDNTcuNSAzOC41IDU4IDM5LjcgNTggNDFDNTggNDIuMyA1Ny41IDQzLjUgNTYuNiA0NC41QzU1LjcgNDUuNSA1NC41IDQ2IDUzIDQ2SDQ0VjU0SDU4VjU4SDQ0Vjg2SDQwWk00NCA0Mkg1M0M1My42IDQyIDU0LjEgNDEuNyA1NC40IDQxLjFDNTQuNyA0MC41IDU0LjggNDAuMyA1NC44IDQwQzU0LjggMzkuNyA1NC43IDM5LjUgNTQuNCAzOC45QzU0LjEgMzguMyA1My42IDM4IDUzIDM4SDQ0VjQyWiIgZmlsbD0id2hpdGUiLz4KPGRlZnM+CjxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZGllbnQwX2xpbmVhcl8yXzIiIHgxPSIwIiB5MT0iMCIgeDI9IjEyMCIgeTI9IjEyMCIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBzdG9wLWNvbG9yPSIjMTBCOTgxIi8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzVCQzE4QSIvPgo8L2xpbmVhckdyYWRpZW50Pgo8L2RlZnM+Cjwvc3ZnPgo=',
        website: 'https://digitalsolutions.jp',
        industry: 'コンサルティング',
        foundedYear: 2022,
        location: '大阪府大阪市',
        employees: 40,
        funding: '2億円',
        mission: 'デジタル技術で企業の可能性を最大化する',
        vision: '日本のDXを牽引する企業になる',
        values: ['顧客第一', '技術革新', 'チームワーク'],
        trust: {
          total: 4.5,
          byRole: {
            'Employee': 4.6,
            'Customer': 4.4,
            'Advisor': 4.5
          }
        },
        grade: 'A' as const,
        socialLinks: {
          twitter: 'https://twitter.com/digitalsolutions',
          linkedin: 'https://linkedin.com/company/digitalsolutions'
        },
        createdAt: new Date('2024-02-10')
      },
      'startup-hub': {
        _id: '3',
        name: 'StartupHub',
        slug: 'startup-hub',
        description: 'スタートアップ支援プラットフォーム。起業家と投資家、メンター、リソースを繋ぎ、革新的なビジネスの成長を加速させます。',
        logoUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTIwIiByeD0iMjQiIGZpbGw9InVybCgjZ3JhZGllbnQwX2xpbmVhcl8zXzMpIi8+CjxwYXRoIGQ9Ik00MCA4NlYzNkg1M1Y0MEg0NFY1OEg1M1Y2Mkg0NFY4Mkg1NlY4Nkg0MFpNNjUgODZWMzZINjlWNTRINzlWMzZIODNWODZIODVWNTgINjlWODZINjVaIiBmaWxsPSJ3aGl0ZSIvPgo8ZGVmcz4KPGxpbmVhckdyYWRpZW50IGlkPSJncmFkaWVudDBfbGluZWFyXzNfMyIgeDE9IjAiIHkxPSIwIiB4Mj0iMTIwIiB5Mj0iMTIwIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wIHN0b3AtY29sb3I9IiNGNTlFMEIiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjRkI5MjM3Ii8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPC9zdmc+Cg==',
        website: 'https://startuphub.co.jp',
        industry: 'プラットフォーム',
        foundedYear: 2024,
        location: '東京都新宿区',
        employees: 15,
        funding: '1億円',
        mission: 'スタートアップエコシステムを活性化する',
        vision: 'アジア最大のスタートアッププラットフォームになる',
        values: ['起業家精神', 'コミュニティ', '持続可能性'],
        trust: {
          total: 4.7,
          byRole: {
            'Founder': 5.0,
            'Investor': 4.5,
            'Fan': 4.6
          }
        },
        grade: 'A' as const,
        socialLinks: {
          twitter: 'https://twitter.com/startuphub',
          linkedin: 'https://linkedin.com/company/startuphub',
          facebook: 'https://facebook.com/startuphub'
        },
        createdAt: new Date('2024-03-05')
      }
    }

    let company = null;

    // MongoDBから企業データを取得
    try {
      await connectDB();
      
      // URLデコードして複数パターンで検索
      const decodedSlug = decodeURIComponent(slug);
      const dbCompany = await Company.findOne({
        $or: [
          { slug: slug },
          { slug: decodedSlug },
          { name: slug },
          { name: decodedSlug }
        ]
      }).lean();
      
      if (dbCompany) {
        company = {
          _id: dbCompany._id.toString(),
          name: dbCompany.name,
          slug: dbCompany.slug,
          industry: dbCompany.industry,
          description: dbCompany.description,
          founded: dbCompany.founded,
          employees: dbCompany.employees,
          website: dbCompany.website,
          searchCount: dbCompany.searchCount,
          averageRating: dbCompany.averageRating,
          isUserEdited: dbCompany.isUserEdited,
          dataSource: dbCompany.dataSource,
          lastEditedBy: dbCompany.lastEditedBy,
          lastEditedAt: dbCompany.lastEditedAt,
          lastSearchAt: dbCompany.lastSearchAt,
          sources: dbCompany.sources || [],
          editHistory: dbCompany.editHistory,
          createdAt: dbCompany.createdAt,
          updatedAt: dbCompany.updatedAt
        };
      }
    } catch (dbError) {
      console.log('DB error, using demo data:', dbError);
    }

    // MongoDBにデータがない場合は404エラーを返す（デモデータ使用を停止）
    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(company)
  } catch (error) {
    console.error('Error fetching company:', error)
    return NextResponse.json(
      { error: 'Failed to fetch company' },
      { status: 500 }
    )
  }
}

// PUT /api/companies/[slug] - 企業情報を更新（認証必要）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();
    
    const { slug: rawSlug } = await params;
    const slug = rawSlug.toLowerCase();
    const body = await request.json();
    const { name, industry, description, founded, employees, website } = body;
    
    // バリデーション
    if (!name || !industry || !description || !founded || !employees) {
      return NextResponse.json(
        { error: '必須項目を入力してください' },
        { status: 400 }
      );
    }
    
    // 企業を検索
    let company = await Company.findOne({ slug });
    const editor = 'u_hikaru'; // 現在は固定値、認証実装後はリクエストから取得
    
    if (!company) {
      // 新しい企業を作成
      company = new Company({
        name: name.trim(),
        slug: slug,
        industry: industry.trim(),
        description: description.trim(),
        founded: founded.trim(),
        employees: employees.trim(),
        website: website?.trim() || '',
        searchCount: 0,
        averageRating: 0,
        isUserEdited: true,
        dataSource: 'user_edited',
        lastEditedBy: editor,
        lastEditedAt: new Date(),
        editHistory: []
      });
    } else {
      // 既存の企業を更新 - 編集履歴を記録
      const currentTime = new Date();
      
      // 編集履歴配列を初期化（既存のデータで未定義の場合）
      if (!company.editHistory) {
        company.editHistory = [];
      }
      
      // 各フィールドの変更を記録
      const fieldsToCheck = [
        { field: 'name', oldValue: company.name, newValue: name.trim() },
        { field: 'industry', oldValue: company.industry, newValue: industry.trim() },
        { field: 'description', oldValue: company.description, newValue: description.trim() },
        { field: 'founded', oldValue: company.founded, newValue: founded.trim() },
        { field: 'employees', oldValue: company.employees, newValue: employees.trim() },
        { field: 'website', oldValue: company.website || '', newValue: website?.trim() || '' }
      ];
      
      // 編集履歴を作成
      const newEditHistory = [];
      fieldsToCheck.forEach(({ field, oldValue, newValue }) => {
        if (oldValue !== newValue) {
          const editEntry = {
            field,
            oldValue,
            newValue,
            editor,
            editedAt: currentTime,
            reason: body.reason || '情報更新'
          };
          newEditHistory.push(editEntry);
          console.log(`Edit detected: ${field} changed from "${oldValue}" to "${newValue}"`);
        }
      });
      
      console.log(`Creating ${newEditHistory.length} edit history entries`);
      
      // MongoDBで直接更新（Mongooseの配列操作の問題を回避）
      const updateResult = await Company.updateOne(
        { slug },
        {
          $set: {
            name: name.trim(),
            industry: industry.trim(),
            description: description.trim(),
            founded: founded.trim(),
            employees: employees.trim(),
            website: website?.trim() || '',
            isUserEdited: true,
            dataSource: 'user_edited',
            lastEditedBy: editor,
            lastEditedAt: currentTime
          },
          $push: { editHistory: { $each: newEditHistory } }
        }
      );
      
      console.log('Update result:', updateResult.modifiedCount, 'documents modified');
      
      // 更新後のデータを取得
      company = await Company.findOne({ slug }).lean();
    }
    
    return NextResponse.json({
      success: true,
      message: '企業情報を更新しました',
      company: {
        id: company._id.toString(),
        name: company.name,
        slug: company.slug,
        industry: company.industry,
        description: company.description,
        founded: company.founded,
        employees: company.employees,
        website: company.website,
        searchCount: company.searchCount,
        averageRating: company.averageRating,
        editHistory: company.editHistory,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt
      }
    });
    
  } catch (error) {
    console.error('Update company error:', error);
    return NextResponse.json(
      { error: '企業情報の更新に失敗しました' },
      { status: 500 }
    );
  }
}