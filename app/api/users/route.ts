import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import mongoose from 'mongoose'
import { promises as fs } from 'fs'
import path from 'path'
import ConnectionRequest from '@/models/ConnectionRequest'
import User from '@/models/User'
import { validateSession } from '@/lib/auth-middleware'

interface UserProfile {
  id: string
  username: string
  name: string
  email: string
  bio?: string
  company?: string
  position?: string
  role?: 'founder' | 'investor' | 'employee' | 'advisor' | 'other'
  profileImage?: string
  trustScore: number
  connectionCount: number
  reviewCount: number
  badgeCount: number
  joinedDate: string
  lastActive: string
  isPublic: boolean
  interests: string[]
  skills: string[]
  connectionStatus?: 'none' | 'pending' | 'connected' | 'received'
  connectionRequestId?: string
  achievements: {
    id: string
    title: string
    description: string
    earnedDate: string
    badge: string
  }[]
  recentActivity: {
    id: string
    type: 'review' | 'connection' | 'badge' | 'introduction'
    description: string
    date: string
  }[]
  connections?: {
    id: string
    name: string
    company: string
    profileImage?: string
  }[]
}

// Role translation map
const roleTranslation = {
  'founder': '創業者',
  'investor': '投資家', 
  'employee': '従業員',
  'advisor': 'アドバイザー',
  'other': 'その他'
}

export async function GET(request: NextRequest) {
  try {
    const authUser = await validateSession(request)
    
    await connectDB()
    const db = mongoose.connection.db

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    const roleFilter = searchParams.get('role')

    // Get current user for connection status
    let currentUser = null
    if (authUser?.id) {
      currentUser = await User.findById(authUser.id)
    }

    // Fetch real users from MongoDB
    const mongoUsers = await db.collection('users').find({}).toArray()
    const userProfiles = await db.collection('userprofiles').find({
      userId: { $in: mongoUsers.map(user => user._id) }
    }).toArray()
    const profileMap = new Map(userProfiles.map(profile => [profile.userId.toString(), profile]))
    
    // Transform MongoDB users to UserProfile format
    const transformedUsers: UserProfile[] = await Promise.all(mongoUsers.map(async (user) => {
      // Get user evaluations to calculate stats
      const userEvaluations = await db.collection('evaluations').find({
        $or: [
          { userId: user._id.toString() },
          { userId: `u_${user.name?.toLowerCase().replace(/\s/g, '_')}` }
        ]
      }).toArray()

      const reviewCount = userEvaluations.length
      const trustScore = reviewCount > 0 
        ? Math.round((userEvaluations.reduce((sum, e) => sum + e.rating, 0) / reviewCount) * 10) / 10
        : 4.5

      // Use username from database, or create from email/name as fallback
      let username = user.username || user.email?.split('@')[0] || user.name?.toLowerCase().replace(/\s/g, '-') || 'user'

      // Check for uploaded profile images
      let profileImage = user.image
      if (!profileImage) {
        const uploadsPath = path.join(process.cwd(), 'public', 'uploads', 'profiles')
        try {
          const files = await fs.readdir(uploadsPath)
          const userImageFile = files.find(file => file.startsWith(`${user._id.toString()}_`))
          if (userImageFile) {
            profileImage = `/uploads/profiles/${userImageFile}`
          }
        } catch (error) {
          // Files directory doesn't exist or other error, use fallback
        }
      }

      // Determine connection status
      let connectionStatus: 'none' | 'pending' | 'connected' | 'received' = 'none'
      let connectionRequestId: string | undefined

      if (currentUser && currentUser._id.toString() !== user._id.toString()) {
        // Check if already connected via connections collection
        const connection = await db.collection('connections').findOne({
          users: { $all: [currentUser._id, user._id] },
          status: 'active'
        })
        
        if (connection) {
          connectionStatus = 'connected'
        } else {
          // Check for pending connection requests
          const sentRequest = await ConnectionRequest.findOne({
            requester: currentUser._id,
            recipient: user._id,
            status: 'pending'
          })
          
          const receivedRequest = await ConnectionRequest.findOne({
            requester: user._id,
            recipient: currentUser._id,
            status: 'pending'
          })
          
          if (sentRequest) {
            connectionStatus = 'pending'
            connectionRequestId = sentRequest._id.toString()
          } else if (receivedRequest) {
            connectionStatus = 'received'
            connectionRequestId = receivedRequest._id.toString()
          }
        }
      }

      let reachCount = 0
      try {
        const activeConnections = await db.collection('connections').find({
          users: user._id,
          status: 'active'
        }).toArray()

        const participantIds = Array.from(
          new Set([
            user._id.toString(),
            ...activeConnections
              .map(conn => conn.users.find((id: any) => id.toString() !== user._id.toString()))
              .filter((id): id is any => !!id)
              .map((id: any) => id.toString())
          ])
        )

        if (participantIds.length > 0) {
          const uniqueCompanies = await db.collection('evaluations').distinct('companySlug', {
            userId: { $in: participantIds }
          })
          reachCount = uniqueCompanies.length
        }
      } catch (err) {
        console.warn('Error computing connection reach for', user._id.toString(), err)
      }

      const userProfileDoc = profileMap.get(user._id.toString())
      const interests =
        (userProfileDoc?.interests && userProfileDoc.interests.length > 0
          ? userProfileDoc.interests
          : user.interests) || ['スタートアップ', 'ビジネス', 'テクノロジー']

      const skills =
        (userProfileDoc?.skills && userProfileDoc.skills.length > 0
          ? userProfileDoc.skills
          : user.skills) || ['ビジネス開発', 'ネットワーキング']

      return {
        id: user._id.toString(),
        username: username,
        name: user.name,
        email: user.email,
        bio: user.bio || `${roleTranslation[user.role] || user.role}として活動中`,
        company: user.company || '未設定',
        position: user.position || roleTranslation[user.role] || user.role,
        role: user.role,
        profileImage: profileImage || `/avatars/${username}.jpg`,
        trustScore: trustScore,
        connectionCount: reachCount,
        reviewCount: reviewCount,
        badgeCount: user.badgeCount || Math.floor(reviewCount / 5) + 1,
        joinedDate: user.createdAt || new Date().toISOString(),
        lastActive: user.lastActive || user.updatedAt || new Date().toISOString(),
        isPublic: user.isPublic !== false,
        interests,
        skills,
        connectionStatus,
        connectionRequestId,
        achievements: [{
          id: 'member',
          title: 'メンバー',
          description: 'Bondのメンバー',
          earnedDate: user.createdAt || new Date().toISOString(),
          badge: '🎯'
        }],
        recentActivity: [{
          id: 'joined',
          type: 'connection' as const,
          description: 'Bondに参加しました',
          date: new Date(user.createdAt || new Date()).toLocaleDateString('ja-JP')
        }]
      }
    }))

    let filteredUsers = transformedUsers.filter(user => user.isPublic)
    const availableRoles = Array.from(
      new Set(
        transformedUsers
          .map(user => user.role)
          .filter((role): role is UserProfile['role'] => Boolean(role))
      )
    )

    // Search functionality
    if (search) {
      const searchLower = search.toLowerCase()
      filteredUsers = filteredUsers.filter(user =>
        user.name.toLowerCase().includes(searchLower) ||
        user.username.toLowerCase().includes(searchLower) ||
        user.company?.toLowerCase().includes(searchLower) ||
        user.position?.toLowerCase().includes(searchLower) ||
        user.bio?.toLowerCase().includes(searchLower) ||
        user.interests.some(interest => interest.toLowerCase().includes(searchLower)) ||
        user.skills.some(skill => skill.toLowerCase().includes(searchLower))
      )
    }
    if (roleFilter && roleFilter !== 'all') {
      filteredUsers = filteredUsers.filter(user => user.role === roleFilter)
    }

    // Sort by trust score and last active
    filteredUsers.sort((a, b) => {
      if (b.trustScore !== a.trustScore) {
        return b.trustScore - a.trustScore
      }
      return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()
    })

    // Pagination
    const paginatedUsers = filteredUsers.slice(offset, offset + limit)

    // Remove sensitive data for public view
    const publicUsers = paginatedUsers.map(user => ({
      ...user,
      email: user.isPublic ? user.email : undefined,
      connections: undefined // Don't expose full connection list in search
    }))

    return NextResponse.json({
      success: true,
      users: publicUsers,
      availableRoles,
      pagination: {
        total: filteredUsers.length,
        limit,
        offset,
        hasMore: offset + limit < filteredUsers.length
      }
    })

  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
