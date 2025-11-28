import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import connectDB from '@/lib/mongodb'
import mongoose from 'mongoose'

interface Connection {
  id: string
  name: string
  company: string
  trustScore: number
  connectionStrength: number
  industry: string
  position: string
  profileImage?: string
}

interface ReferralRoute {
  path: Connection[]
  totalTrustScore: number
  efficiency: number
  successProbability: number
  estimatedDays: number
}

async function getUserConnections(userId: string): Promise<Connection[]> {
  await connectDB()
  const db = mongoose.connection.db
  if (!db) return []

  try {
    // ユーザーの接続を取得
    const connections = await db.collection("connections").find({
      users: new mongoose.Types.ObjectId(userId),
      status: 'active'
    }).toArray()
    
    const userConnections: Connection[] = []
    
    for (const conn of connections) {
      // 他のユーザーのIDを取得
      const otherUserId = conn.users.find((id: any) => id.toString() !== userId)
      if (!otherUserId) continue
      
      // 他のユーザーの情報を取得
      const otherUser = await db.collection("users").findOne({ _id: otherUserId })
      if (!otherUser) continue
      
      // 他のユーザーの評価に基づく信頼度スコアを計算
      const evaluations = await db.collection("evaluations").find({
        userId: otherUserId.toString()
      }).toArray()
      
      const avgRating = evaluations.length > 0 
        ? evaluations.reduce((sum, evaluation) => sum + evaluation.rating, 0) / evaluations.length
        : 3.5
      
      userConnections.push({
        id: otherUserId.toString(),
        name: otherUser.name,
        company: otherUser.company || 'Unknown',
        trustScore: Math.min(5, avgRating),
        connectionStrength: conn.strength || 0.7,
        industry: otherUser.industry || 'Technology',
        position: otherUser.position || 'Professional',
        profileImage: otherUser.image
      })
    }
    
    return userConnections
  } catch (error) {
    console.error('Error fetching user connections:', error)
    return []
  }
}

async function findCompanyConnections(targetCompany: string): Promise<Connection[]> {
  await connectDB()
  const db = mongoose.connection.db
  if (!db) return []

  try {
    // 目標企業を評価したユーザーを検索
    const companyEvaluations = await db.collection("evaluations").find({
      $or: [
        { companyName: { $regex: new RegExp(targetCompany, 'i') } },
        { companySlug: { $regex: new RegExp(targetCompany, 'i') } }
      ]
    }).toArray()
    
    const companyConnections: Connection[] = []
    
    for (const evaluation of companyEvaluations) {
      // 評価者の情報を取得
      let user = null
      
      // ObjectId形式の場合
      if (mongoose.Types.ObjectId.isValid(evaluation.userId)) {
        user = await db.collection("users").findOne({ 
          _id: new mongoose.Types.ObjectId(evaluation.userId) 
        })
      } else {
        // 古い形式のuserIdを処理
        if (evaluation.userId === 'u_hikaru') {
          user = await db.collection("users").findOne({ 
            name: { $regex: /hikaru/i } 
          })
        } else if (evaluation.userId === 'team' || evaluation.userId === 'u_team') {
          user = await db.collection("users").findOne({ 
            email: 'team@hackjpn.com' 
          })
        }
      }
      
      if (user) {
        companyConnections.push({
          id: user._id.toString(),
          name: user.name,
          company: evaluation.companyName,
          trustScore: evaluation.rating,
          connectionStrength: 0.8, // 企業との関係の強度
          industry: user.industry || 'Technology',
          position: user.position || evaluation.relationship || 'Professional',
          profileImage: user.image
        })
      }
    }
    
    return companyConnections
  } catch (error) {
    console.error('Error finding company connections:', error)
    return []
  }
}

async function getHubUser(): Promise<Connection | null> {
  // Hikaru Tomura をハブユーザーとして取得（全ユーザーと繋がっている）
  await connectDB()
  const db = mongoose.connection.db
  if (!db) return null

  try {
    const hubUser = await db.collection("users").findOne({
      $or: [
        { email: 'tomura@hackjpn.com' },
        { name: { $regex: /hikaru.*tomura/i } },
        { name: { $regex: /tomura.*hikaru/i } }
      ]
    })

    if (hubUser) {
      // ハブユーザーの評価に基づく信頼度スコアを計算
      const evaluations = await db.collection("evaluations").find({
        userId: hubUser._id.toString()
      }).toArray()

      const avgRating = evaluations.length > 0
        ? evaluations.reduce((sum, e) => sum + e.rating, 0) / evaluations.length
        : 4.5

      return {
        id: hubUser._id.toString(),
        name: hubUser.name || 'Hikaru Tomura',
        company: hubUser.company || 'HackJPN',
        trustScore: Math.min(5, avgRating),
        connectionStrength: 0.9,
        industry: hubUser.industry || 'Technology',
        position: hubUser.position || 'Founder',
        profileImage: hubUser.image
      }
    }
    return null
  } catch (error) {
    console.error('Error fetching hub user:', error)
    return null
  }
}

async function getAllUsersWhoEvaluatedCompany(targetCompany: string): Promise<Connection[]> {
  await connectDB()
  const db = mongoose.connection.db
  if (!db) return []

  try {
    // 目標企業を評価した全ユーザーを取得
    const evaluations = await db.collection("evaluations").find({
      $or: [
        { companyName: { $regex: new RegExp(targetCompany, 'i') } },
        { companySlug: { $regex: new RegExp(targetCompany, 'i') } }
      ]
    }).toArray()

    const connections: Connection[] = []
    const seenUserIds = new Set<string>()

    for (const evaluation of evaluations) {
      let user = null

      if (mongoose.Types.ObjectId.isValid(evaluation.userId)) {
        user = await db.collection("users").findOne({
          _id: new mongoose.Types.ObjectId(evaluation.userId)
        })
      }

      if (user && !seenUserIds.has(user._id.toString())) {
        seenUserIds.add(user._id.toString())
        connections.push({
          id: user._id.toString(),
          name: user.name,
          company: evaluation.companyName,
          trustScore: evaluation.rating,
          connectionStrength: 0.8,
          industry: user.industry || 'Technology',
          position: user.position || evaluation.relationship || 'Professional',
          profileImage: user.image
        })
      }
    }

    return connections
  } catch (error) {
    console.error('Error finding users who evaluated company:', error)
    return []
  }
}

// 2人のユーザー間に実際の接続があるかをチェック
async function checkConnectionExists(userId1: string, userId2: string): Promise<boolean> {
  await connectDB()
  const db = mongoose.connection.db
  if (!db) return false

  try {
    const connection = await db.collection("connections").findOne({
      users: {
        $all: [
          new mongoose.Types.ObjectId(userId1),
          new mongoose.Types.ObjectId(userId2)
        ]
      },
      status: 'active'
    })

    return !!connection
  } catch (error) {
    console.error('Error checking connection:', error)
    return false
  }
}

// ユーザーの全接続者のIDセットを取得
async function getUserConnectionIds(userId: string): Promise<Set<string>> {
  await connectDB()
  const db = mongoose.connection.db
  if (!db) return new Set()

  try {
    const connections = await db.collection("connections").find({
      users: new mongoose.Types.ObjectId(userId),
      status: 'active'
    }).toArray()

    const connectedIds = new Set<string>()
    for (const conn of connections) {
      const otherUserId = conn.users.find((id: any) => id.toString() !== userId)
      if (otherUserId) {
        connectedIds.add(otherUserId.toString())
      }
    }

    return connectedIds
  } catch (error) {
    console.error('Error getting user connection IDs:', error)
    return new Set()
  }
}

async function calculateOptimalRoute(
  currentUserId: string,
  targetCompany: string,
  userConnections: Connection[],
  companyConnections: Connection[],
  hubUser: Connection | null
): Promise<ReferralRoute[]> {
  const routes: ReferralRoute[] = []

  // 現在のユーザーの接続者のIDセットを取得
  const currentUserConnectionIds = new Set(userConnections.map(c => c.id))

  // 1. 直接接続ルート - ユーザーの接続に目標企業の関係者がいる場合
  const directConnections = userConnections.filter(conn =>
    conn.company.toLowerCase().includes(targetCompany.toLowerCase()) ||
    companyConnections.some(cc => cc.id === conn.id)
  )

  directConnections.forEach(directConn => {
    routes.push({
      path: [directConn],
      totalTrustScore: directConn.trustScore,
      efficiency: 0.95,
      successProbability: Math.min(0.9, directConn.trustScore / 5 * 0.9),
      estimatedDays: 3
    })
  })

  // 2. 間接ルート - 信頼できる中間者を通じたルート（実際の接続を確認）
  const highTrustConnections = userConnections.filter(conn =>
    conn.trustScore >= 3.5 && conn.connectionStrength >= 0.5
  )

  for (const intermediary of highTrustConnections) {
    // 中間者の接続者IDを取得
    const intermediaryConnectionIds = await getUserConnectionIds(intermediary.id)

    // companyConnectionsの中で、中間者と実際に接続している人のみを対象
    const connectedTargets = companyConnections.filter(cc =>
      cc.id !== intermediary.id && intermediaryConnectionIds.has(cc.id)
    )

    for (const targetConn of connectedTargets) {
      const avgTrustScore = (intermediary.trustScore + targetConn.trustScore) / 2
      const efficiency = Math.min(0.85, intermediary.connectionStrength * 0.8)

      routes.push({
        path: [intermediary, targetConn],
        totalTrustScore: avgTrustScore,
        efficiency,
        successProbability: Math.min(0.75, avgTrustScore / 5 * 0.75),
        estimatedDays: 7
      })
    }
  }

  // 3. ハブユーザー（Hikaru Tomura）経由のルート
  if (hubUser) {
    // まず現在のユーザーがハブユーザーと接続しているか確認
    const isConnectedToHub = currentUserConnectionIds.has(hubUser.id)

    if (isConnectedToHub) {
      // ハブユーザーが目標企業を直接評価している場合
      const hubDirectConnection = companyConnections.find(cc => cc.id === hubUser.id)

      if (hubDirectConnection) {
        const alreadyAdded = routes.some(r =>
          r.path.length === 1 && r.path[0].id === hubUser.id
        )
        if (!alreadyAdded) {
          routes.push({
            path: [hubUser],
            totalTrustScore: hubUser.trustScore,
            efficiency: 0.9,
            successProbability: Math.min(0.85, hubUser.trustScore / 5 * 0.85),
            estimatedDays: 5
          })
        }
      }

      // ハブユーザーの接続者を取得
      const hubConnectionIds = await getUserConnectionIds(hubUser.id)

      // ハブユーザー経由で目標企業の関係者に繋がるルート（実際の接続を確認）
      for (const targetConn of companyConnections) {
        if (targetConn.id === hubUser.id) continue

        // ハブユーザーが実際にこの人と接続しているか確認
        if (!hubConnectionIds.has(targetConn.id)) continue

        const alreadyAdded = routes.some(r =>
          r.path.length === 2 &&
          r.path[0].id === hubUser.id &&
          r.path[1].id === targetConn.id
        )

        if (!alreadyAdded) {
          const avgTrustScore = (hubUser.trustScore + targetConn.trustScore) / 2

          routes.push({
            path: [hubUser, targetConn],
            totalTrustScore: avgTrustScore,
            efficiency: 0.8,
            successProbability: Math.min(0.7, avgTrustScore / 5 * 0.7),
            estimatedDays: 10
          })
        }
      }
    }
  }

  // 4. 最終フォールバック: ハブユーザーのみ（ユーザーがハブユーザーと接続している場合）
  if (routes.length === 0 && hubUser && currentUserConnectionIds.has(hubUser.id)) {
    routes.push({
      path: [hubUser],
      totalTrustScore: hubUser.trustScore,
      efficiency: 0.6,
      successProbability: 0.5,
      estimatedDays: 14
    })
  }

  // 効率と信頼度でソート
  return routes
    .sort((a, b) => (b.efficiency * b.totalTrustScore) - (a.efficiency * a.totalTrustScore))
    .slice(0, 5) // 上位5ルートのみ返す
}

export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    const { targetCompany } = await request.json()

    if (!targetCompany) {
      return NextResponse.json({ error: 'Target company is required' }, { status: 400 })
    }

    // ユーザーの接続情報を取得
    const userConnections = await getUserConnections(user.id)

    // 目標企業に関連するユーザーを検索
    const companyConnections = await findCompanyConnections(targetCompany)

    // ハブユーザー（Hikaru Tomura）を取得 - フォールバック用
    const hubUser = await getHubUser()

    // 最適ルートを計算（ハブユーザーを含む、実際の接続を検証）
    const optimalRoutes = await calculateOptimalRoute(user.id, targetCompany, userConnections, companyConnections, hubUser)

    const averageSuccessRate = optimalRoutes.length > 0
      ? optimalRoutes.reduce((acc, route) => acc + route.successProbability, 0) / optimalRoutes.length
      : 0

    return NextResponse.json({
      targetCompany,
      routes: optimalRoutes,
      analysis: {
        totalRoutes: optimalRoutes.length,
        bestRoute: optimalRoutes[0] || null,
        averageSuccessRate,
        hubUserAvailable: !!hubUser
      }
    })
  } catch (error) {
    console.error('Error calculating referral routes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const industry = searchParams.get('industry')

  if (industry) {
    // 業界で会社を検索
    await connectDB()
    const db = mongoose.connection.db
    if (!db) {
      return NextResponse.json({ companies: [] })
    }

    try {
      const companies = await db.collection("companies").find({
        industry: { $regex: new RegExp(industry, 'i') }
      }).sort({ searchCount: -1 }).limit(20).toArray()

      return NextResponse.json({
        companies: companies.map(c => ({
          id: c._id.toString(),
          name: c.name,
          slug: c.slug,
          industry: c.industry,
          description: c.description?.substring(0, 100) + '...',
          averageRating: c.averageRating || 0
        }))
      })
    } catch (error) {
      console.error('Error searching companies by industry:', error)
      return NextResponse.json({ companies: [] })
    }
  }

  // 業界一覧を取得
  await connectDB()
  const db = mongoose.connection.db
  if (!db) {
    return NextResponse.json({ industries: [], popularCompanies: [] })
  }

  try {
    // 業界一覧（不要な値を除外）
    const excludeIndustries = ['情報収集中...', '未分類', '', null, undefined]
    const industries = await db.collection("companies").aggregate([
      { $match: { industry: { $nin: excludeIndustries, $exists: true, $ne: '' } } },
      { $group: { _id: '$industry', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]).toArray()

    // 評価が多い企業（ルートがある可能性が高い）を取得
    const popularCompaniesData = await db.collection("evaluations").aggregate([
      { $group: { _id: '$companyName', count: { $sum: 1 }, avgRating: { $avg: '$rating' } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]).toArray()

    const popularCompanies = popularCompaniesData
      .filter(c => c._id) // null/undefinedを除外
      .map(c => ({
        name: c._id,
        evaluationCount: c.count,
        avgRating: c.avgRating
      }))

    return NextResponse.json({
      industries: industries.map(i => ({
        name: i._id,
        count: i.count
      })),
      popularCompanies
    })
  } catch (error) {
    console.error('Error fetching industries:', error)
    return NextResponse.json({ industries: [], popularCompanies: [] })
  }
}