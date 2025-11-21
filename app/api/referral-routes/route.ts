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

function calculateOptimalRoute(targetCompany: string, userConnections: Connection[], companyConnections: Connection[]): ReferralRoute[] {
  const routes: ReferralRoute[] = []
  
  // 直接接続ルート - ユーザーの接続に目標企業の関係者がいる場合
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
  
  // 間接ルート - 信頼できる中間者を通じたルート
  const highTrustConnections = userConnections.filter(conn => 
    conn.trustScore >= 4.0 && conn.connectionStrength >= 0.6
  )
  
  highTrustConnections.forEach(intermediary => {
    const targetConnections = companyConnections.filter(cc => cc.id !== intermediary.id)
    
    targetConnections.forEach(targetConn => {
      const avgTrustScore = (intermediary.trustScore + targetConn.trustScore) / 2
      const efficiency = Math.min(0.85, intermediary.connectionStrength * 0.8)
      
      routes.push({
        path: [intermediary, targetConn],
        totalTrustScore: avgTrustScore,
        efficiency,
        successProbability: Math.min(0.75, avgTrustScore / 5 * 0.75),
        estimatedDays: 7
      })
    })
  })
  
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
    
    // 最適ルートを計算
    const optimalRoutes = calculateOptimalRoute(targetCompany, userConnections, companyConnections)
    
    const averageSuccessRate = optimalRoutes.length > 0 
      ? optimalRoutes.reduce((acc, route) => acc + route.successProbability, 0) / optimalRoutes.length
      : 0
    
    return NextResponse.json({
      targetCompany,
      routes: optimalRoutes,
      analysis: {
        totalRoutes: optimalRoutes.length,
        bestRoute: optimalRoutes[0] || null,
        averageSuccessRate
      }
    })
  } catch (error) {
    console.error('Error calculating referral routes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})

export async function GET() {
  return NextResponse.json({
    message: 'Referral routes API',
    endpoints: {
      POST: 'Calculate optimal referral routes for a target company'
    }
  })
}