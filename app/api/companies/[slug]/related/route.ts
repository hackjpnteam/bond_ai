import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Company from '@/models/Company';

interface RelatedCompany {
  name: string;
  slug: string;
  industry: string;
  averageRating: number;
  searchCount: number;
}

// GET /api/companies/[slug]/related - 関連企業を取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    await connectDB();

    // 現在の会社を取得
    const currentCompany = await Company.findOne({ slug: slug.toLowerCase() }).lean();

    if (!currentCompany) {
      // 会社が見つからない場合は、検索回数でソートした人気企業を返す
      const popularCompanies = await Company.find({})
        .sort({ searchCount: -1 })
        .limit(5)
        .select('name slug industry averageRating searchCount')
        .lean();

      return NextResponse.json({
        success: true,
        relatedCompanies: popularCompanies.map(c => ({
          name: c.name,
          slug: c.slug,
          industry: c.industry || '情報収集中',
          averageRating: c.averageRating || 0,
          searchCount: c.searchCount || 0
        })),
        source: 'popular'
      });
    }

    // 関連企業を取得（同じ業界 + 検索回数上位）
    const relatedCompanies: RelatedCompany[] = [];
    const addedSlugs = new Set<string>([slug.toLowerCase()]);

    // 1. 同じ業界の企業（検索回数順）
    if (currentCompany.industry && currentCompany.industry !== '情報収集中...' && currentCompany.industry !== '情報収集中') {
      const sameIndustryCompanies = await Company.find({
        slug: { $ne: slug.toLowerCase() },
        industry: { $regex: new RegExp(currentCompany.industry.split(/[・/／,、]/).map(t => t.trim()).filter(Boolean)[0] || currentCompany.industry, 'i') }
      })
        .sort({ searchCount: -1 })
        .limit(3)
        .select('name slug industry averageRating searchCount')
        .lean();

      for (const company of sameIndustryCompanies) {
        if (!addedSlugs.has(company.slug)) {
          addedSlugs.add(company.slug);
          relatedCompanies.push({
            name: company.name,
            slug: company.slug,
            industry: company.industry || '情報収集中',
            averageRating: company.averageRating || 0,
            searchCount: company.searchCount || 0
          });
        }
      }
    }

    // 2. よく検索されている企業（異なる業界も含む）で追加
    if (relatedCompanies.length < 5) {
      const popularCompanies = await Company.find({
        slug: { $nin: Array.from(addedSlugs) }
      })
        .sort({ searchCount: -1 })
        .limit(5 - relatedCompanies.length)
        .select('name slug industry averageRating searchCount')
        .lean();

      for (const company of popularCompanies) {
        if (!addedSlugs.has(company.slug)) {
          addedSlugs.add(company.slug);
          relatedCompanies.push({
            name: company.name,
            slug: company.slug,
            industry: company.industry || '情報収集中',
            averageRating: company.averageRating || 0,
            searchCount: company.searchCount || 0
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      relatedCompanies,
      currentIndustry: currentCompany.industry,
      source: 'related'
    });

  } catch (error) {
    console.error('Error fetching related companies:', error);
    return NextResponse.json(
      { error: '関連企業の取得に失敗しました' },
      { status: 500 }
    );
  }
}
