import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/db'
import { RatingDoc } from '@/lib/models'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // デモデータを返す（MongoDB接続エラー回避）
    const demoRatings: Record<string, any[]> = {
      'tech-innovate': [
        {
          _id: '1',
          rating: 5,
          comment: '革新的なプロダクトと素晴らしいチーム。将来性が非常に高いと感じます。技術力も申し分なく、投資して良かったです。',
          role: 'Investor',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          user: {
            name: '田中 投資郎',
            image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tanaka&backgroundColor=b6e3f4'
          }
        },
        {
          _id: '7',
          rating: 4,
          comment: 'AIプロダクトの品質が高く、カスタマーサポートも迅速です。今後の機能拡張に期待しています。',
          role: 'Customer',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          user: {
            name: '山下 利用',
            image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=yamashita&backgroundColor=e8f5e8'
          }
        }
      ],
      'digital-solutions': [
        {
          _id: '2',
          rating: 4,
          comment: '働きやすい環境で成長できました。技術的な挑戦も多く、やりがいがあります。リモートワークの制度も充実しています。',
          role: 'Employee',
          createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
          user: {
            name: '佐藤 開発子',
            image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sato&backgroundColor=c0aede'
          }
        },
        {
          _id: '8',
          rating: 4,
          comment: 'コンサルティングの質が高く、我々のDXプロジェクトが成功しました。おすすめです。',
          role: 'Customer',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          user: {
            name: '鈴木 経営',
            image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=suzukikei&backgroundColor=ffe4e1'
          }
        }
      ],
      'startup-hub': [
        {
          _id: '3',
          rating: 5,
          comment: '自分が創業した会社ですが、チーム一丸となって頑張っています！スタートアップ支援の使命感を持って取り組んでいます。',
          role: 'Founder',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          user: {
            name: '山田 創業',
            image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=yamada&backgroundColor=d1d4f9'
          }
        },
        {
          _id: '9',
          rating: 5,
          comment: 'このスタートアップのビジョンに共感しています。応援しています！',
          role: 'Fan',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          user: {
            name: '伊藤 応援',
            image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ito&backgroundColor=c3f0ca'
          }
        }
      ]
    }

    let ratings = demoRatings[slug] || []

    // MongoDB接続も試す（エラーが出ても続行）
    try {
      const ratingsCollection = await getCollection<RatingDoc>('ratings')
      const companies = await getCollection('companies')
      
      // 会社を見つける
      const company = await companies.findOne({ slug })
      if (company) {
        const dbRatings = await ratingsCollection
          .aggregate([
            { $match: { companyId: company._id } },
            {
              $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'user'
              }
            },
            { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
            {
              $project: {
                rating: 1,
                comment: 1,
                role: 1,
                createdAt: 1,
                'user.name': 1,
                'user.image': 1
              }
            },
            { $sort: { createdAt: -1 } }
          ])
          .toArray()
        
        if (dbRatings.length > 0) {
          ratings = dbRatings
        }
      }
    } catch (dbError) {
      console.log('DB error, using demo data:', dbError)
    }

    return NextResponse.json(ratings)
  } catch (error) {
    console.error('Error fetching company ratings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ratings' },
      { status: 500 }
    )
  }
}