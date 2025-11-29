import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Evaluation from '@/models/Evaluation'
import Company from '@/models/Company'

export async function GET() {
  try {
    await connectDB()

    const topCompanies = await Evaluation.aggregate([
      {
        $group: {
          _id: '$companySlug',
          companyName: { $first: '$companyName' },
          averageRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 },
          latestCreatedAt: { $max: '$createdAt' }
        }
      },
      {
        $match: {
          averageRating: { $gt: 0 },
          reviewCount: { $gt: 0 }
        }
      },
      {
        $addFields: {
          weightedScore: { $multiply: ['$averageRating', '$reviewCount'] }
        }
      },
      {
        $sort: { reviewCount: -1, weightedScore: -1, averageRating: -1 }
      },
      {
        $limit: 3
      }
    ])

    if (!topCompanies.length) {
      return NextResponse.json({ success: true, companies: [] })
    }

    const slugs = topCompanies.map((item) => item._id)
    const companyDocs = await Company.find({ slug: { $in: slugs } })
      .select('slug industry description logoUrl website grade')
      .lean()
    const companyMap = new Map(companyDocs.map((doc) => [doc.slug, doc]))

    const gradeFromScore = (score: number) => {
      if (score >= 4.5) return 'A'
      if (score >= 4) return 'B'
      if (score >= 3) return 'C'
      if (score >= 2) return 'D'
      return 'E'
    }

    const payload = topCompanies.map((item) => {
      const companyInfo = companyMap.get(item._id)
      const averageRating = Number(item.averageRating?.toFixed(2) || 0)
      return {
        name: item.companyName || companyInfo?.name || item._id,
        slug: item._id,
        industry: companyInfo?.industry || '情報不足',
        description: companyInfo?.description || '',
        logoUrl: companyInfo?.logoUrl,
        website: companyInfo?.website,
        averageRating,
        reviewCount: item.reviewCount,
        weightedScore: Number((averageRating * item.reviewCount).toFixed(2)),
        grade: gradeFromScore(averageRating)
      }
    })

    return NextResponse.json({ success: true, companies: payload })
  } catch (error) {
    console.error('Error fetching ranking:', error)
    return NextResponse.json(
      { success: false, error: 'ランキングの取得に失敗しました' },
      { status: 500 }
    )
  }
}
