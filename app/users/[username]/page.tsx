'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import {
  ArrowLeft, User, MapPin, Calendar, Star, Users, MessageCircle,
  Award, TrendingUp, ExternalLink, Shield, Mail, Settings,
  Clock, Eye, Plus, Loader2, Check, X, Building2, Pencil
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { getRelationshipLabel } from '@/lib/relationship'
import EditEvaluationModal from '@/components/EditEvaluationModal'

interface UserProfile {
  id: string
  username?: string
  name: string
  email: string
  bio?: string
  company?: string
  position?: string
  role?: 'founder' | 'investor' | 'employee' | 'advisor' | 'other'
  profileImage?: string
  image?: string
  trustScore?: number
  connectionCount?: number
  reviewCount?: number
  badgeCount?: number
  joinedDate?: string
  lastActive?: string
  isPublic?: boolean
  interests?: string[]
  skills?: string[]
  achievements?: {
    id: string
    title: string
    description: string
    earnedDate: string
    badge: string
    category?: string
  }[]
  recentActivity?: {
    id: string
    type: 'review' | 'connection' | 'badge' | 'introduction'
    description: string
    date: string
    companyName?: string
    companySlug?: string
    rating?: number
    badge?: string
  }[]
  connections?: {
    id: string
    name: string
    company: string
    profileImage?: string
  }[]
  companyRelationships?: {
    id: string
    companyName: string
    companySlug: string
    rating: number
    relationshipType: number
    relationshipLabel: string
    relationshipSource?: 'evaluation' | 'label' | 'categories' | 'role' | 'default'
    comment?: string
    categories?: {
      culture: number
      growth: number
      workLifeBalance: number
      compensation: number
      leadership: number
    }
    isAnonymous?: boolean
    createdAt?: string
    updatedAt?: string
  }[]
  createdAt?: string
}

export default function UserProfilePage() {
  const params = useParams()
  const username = params.username as string
  const { user: currentUser } = useAuth()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'connected' | 'received'>('none')
  const [editableInterests, setEditableInterests] = useState<string[]>([])
  const [editableSkills, setEditableSkills] = useState<string[]>([])
  const [newInterest, setNewInterest] = useState('')
  const [newSkill, setNewSkill] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [relationshipFilter, setRelationshipFilter] = useState<number | 'all'>('all')
  const [editingEvaluation, setEditingEvaluation] = useState<UserProfile['companyRelationships'][number] | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  useEffect(() => {
    fetchUserProfile()
    if (currentUser && username) {
      checkConnectionStatus()
    }
  }, [username, currentUser])

  const checkConnectionStatus = async () => {
    if (!currentUser) return

    try {
      const response = await fetch(`/api/connection-status?username=${username}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setConnectionStatus(data.status || 'none')
      }
    } catch (error) {
      console.error('Error checking connection status:', error)
    }
  }

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`/api/users/${username}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('ユーザーが見つかりません')
        } else if (response.status === 403) {
          setError('このプロフィールは非公開に設定されています')
        } else {
          setError('プロフィールの読み込みに失敗しました')
        }
        return
      }

      const data = await response.json()
      setUser(data.user)
      setEditableInterests(data.user?.interests || [])
      setEditableSkills(data.user?.skills || [])
      
      // Check if this is the current user's profile
      const ownsProfile = currentUser && (
        username === currentUser.username || 
        (username === 'tomura' && currentUser.email === 'tomura@hackjpn.com') ||
        (username === 'hikaru' && currentUser.email === 'tomura@hackjpn.com') ||
        (username === 'team' && currentUser.email === 'team@hackjpn.com')
      )
      setIsOwnProfile(!!ownsProfile)
      if (ownsProfile) {
        await loadOwnerProfileDetails()
      }
      
    } catch (error) {
      console.error('Error fetching user profile:', error)
      setError('ネットワークエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const loadOwnerProfileDetails = async () => {
    try {
      const response = await fetch('/api/profile', {
        credentials: 'include'
      })

      if (!response.ok) return
      const profileData = await response.json()
      const profile = profileData?.profile?.profile
      if (!profile) return

      const interests = profile.interests || []
      const skills = profile.skills || []

      setEditableInterests(interests)
      setEditableSkills(skills)
      setUser(prev => prev ? {
        ...prev,
        interests,
        skills,
        profileImage: profile.profileImage || prev.profileImage
      } : prev)
    } catch (error) {
      console.error('Error loading owner profile extras:', error)
    }
  }

  const addInterest = () => {
    const value = newInterest.trim()
    if (!value) return
    if (editableInterests.includes(value)) {
      setNewInterest('')
      return
    }
    setEditableInterests(prev => [...prev, value])
    setNewInterest('')
  }

  const removeInterest = (value: string) => {
    setEditableInterests(prev => prev.filter(item => item !== value))
  }

  const addSkill = () => {
    const value = newSkill.trim()
    if (!value) return
    if (editableSkills.includes(value)) {
      setNewSkill('')
      return
    }
    setEditableSkills(prev => [...prev, value])
    setNewSkill('')
  }

  const removeSkill = (value: string) => {
    setEditableSkills(prev => prev.filter(item => item !== value))
  }

  const arraysEqual = (a: string[], b: string[]) => {
    if (a.length !== b.length) return false
    return a.every((value, index) => value === b[index])
  }

  const hasProfileChanges = useMemo(() => {
    if (!user) return false
    const originalInterests = user.interests || []
    const originalSkills = user.skills || []
    return !arraysEqual(editableInterests, originalInterests) || !arraysEqual(editableSkills, originalSkills)
  }, [user, editableInterests, editableSkills])

  const filteredCompanyRelationships = useMemo(() => {
    if (!user?.companyRelationships) return []
    if (relationshipFilter === 'all') return user.companyRelationships
    return user.companyRelationships.filter(rel => rel.relationshipType === relationshipFilter)
  }, [user?.companyRelationships, relationshipFilter])

  const handleSaveProfileTags = async () => {
    if (!isOwnProfile) return
    setSavingProfile(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          interests: editableInterests,
          skills: editableSkills
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'プロフィールの更新に失敗しました')
      }

      toast.success('プロフィールを更新しました')
      setUser(prev => prev ? {
        ...prev,
        interests: editableInterests,
        skills: editableSkills
      } : prev)
    } catch (error: any) {
      console.error('Error saving profile tags:', error)
      toast.error(error.message || 'プロフィールの更新に失敗しました')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleConnect = async () => {
    if (!user) return
    
    try {
      const response = await fetch('/api/connections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          toUserId: user.username,
          message: `${user.name}さんとつながらせていただければと思います。よろしくお願いいたします。`
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message)
      } else {
        const error = await response.json()
        if (response.status === 409) {
          toast.error('既に接続リクエストが存在します')
        } else {
          toast.error(error.error || '接続リクエストの送信に失敗しました')
        }
      }
    } catch (error) {
      console.error('Error sending connection request:', error)
      toast.error('ネットワークエラーが発生しました')
    }
  }

  const handleMessage = () => {
    if (!user) return
    // メッセージ作成ページに遷移
    const composeUrl = `/messages/compose?to=${encodeURIComponent(user.email || user.username)}&subject=${encodeURIComponent(`${user.name}さんへのメッセージ`)}`
    window.location.href = composeUrl
  }

  const handleEditEvaluation = (relationship: UserProfile['companyRelationships'][number]) => {
    setEditingEvaluation(relationship)
    setIsEditModalOpen(true)
  }

  const handleSaveEvaluation = (updatedEvaluation: any) => {
    if (!user || !user.companyRelationships) return

    // Update the local state with the new evaluation data
    const updatedRelationships = user.companyRelationships.map(rel =>
      rel.id === updatedEvaluation.id ? { ...rel, ...updatedEvaluation } : rel
    )

    setUser({
      ...user,
      companyRelationships: updatedRelationships
    })
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'founder': return '起業家'
      case 'investor': return '投資家'
      case 'employee': return '会社員'
      case 'advisor': return 'アドバイザー'
      default: return 'その他'
    }
  }

  const getRelationshipReason = (source?: string, relationshipData?: any) => {
    const label = relationshipData?.relationshipLabel || getRelationshipLabel(relationshipData?.relationshipType)
    switch (source) {
      case 'evaluation':
        return `評価投稿時に「関係性: ${label}」を選択しました`
      case 'label':
        return `評価データに保存されていたラベルから「${label}」と判定しました`
      case 'categories':
        return `評価カテゴリに設定されていたロールから「${label}」と推定しました`
      case 'role':
        return `プロフィールの役職設定をもとに「${label}」と推定しました`
      default:
        return label === '未設定' ? '十分な情報がなかったため、未設定として表示しています' : `関係性: ${label}`
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'review': return <MessageCircle className="w-4 h-4 text-blue-600" />
      case 'connection': return <Users className="w-4 h-4 text-green-600" />
      case 'badge': return <Award className="w-4 h-4 text-yellow-600" />
      case 'introduction': return <TrendingUp className="w-4 h-4 text-purple-600" />
      default: return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-ash-surface/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">プロフィールを読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-ash-surface/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Eye className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">アクセスできません</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link href="/users" className="btn-dark">
            他のユーザーを見る
          </Link>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-ash-surface/30">
      {/* Header */}
      <div className="bg-white border-b border-ash-line">
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/users" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4" />
            ユーザー一覧に戻る
          </Link>
        </div>
      </div>

      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Profile Header */}
        <div className="card p-4 sm:p-6 lg:p-8 mb-4 sm:mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl font-bold overflow-hidden">
                <img
                  src={user.profileImage || user.image || `/avatars/${username}.jpg`}
                  alt={user.name}
                  className="w-full h-full rounded-full object-cover"
                  onError={(e) => {
                    // フォールバック: 名前の最初の文字を表示
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = user.name.charAt(0);
                  }}
                />
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1 leading-tight break-words">{user.name}</h1>
                  <p className="text-gray-600 mb-2 break-all">@{user.username}</p>
                  {user.company && user.position && (
                    <p className="text-gray-700 font-medium">
                      {user.position} @ {user.company}
                    </p>
                  )}
                </div>
                
                {!isOwnProfile && (
                  <div className="flex gap-3 sm:gap-4 flex-col sm:flex-row mt-4 md:mt-0 w-full sm:w-auto">
                    {connectionStatus === 'connected' ? (
                      <Button disabled variant="outline" className="w-full sm:w-auto bg-green-50 text-green-700 border-green-300">
                        <Check className="w-4 h-4 mr-2" />
                        接続済み
                      </Button>
                    ) : connectionStatus === 'pending' ? (
                      <Button disabled variant="outline" className="w-full sm:w-auto bg-yellow-50 text-yellow-700 border-yellow-300">
                        <Clock className="w-4 h-4 mr-2" />
                        リクエスト中
                      </Button>
                    ) : connectionStatus === 'received' ? (
                      <Button className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
                        <Check className="w-4 h-4 mr-2" />
                        承認する
                      </Button>
                    ) : (
                      <Button onClick={handleConnect} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" />
                        接続する
                      </Button>
                    )}
                    <Button variant="outline" onClick={handleMessage} className="w-full sm:w-auto">
                      <Mail className="w-4 h-4 mr-2" />
                      メッセージ
                    </Button>
                  </div>
                )}
                
                {isOwnProfile && (
                  <Link href="/settings" className="btn-ol mt-4 md:mt-0">
                    <Settings className="w-4 h-4 mr-2" />
                    プロフィール編集
                  </Link>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-xl font-bold text-gray-900">{user.trustScore || 0}</span>
                  </div>
                  <div className="text-sm text-gray-600">信頼スコア</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span className="text-xl font-bold text-gray-900">{user.connectionCount || 0}</span>
                  </div>
                  <div className="text-sm text-gray-600">接続数</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <MessageCircle className="w-4 h-4 text-green-500" />
                    <span className="text-xl font-bold text-gray-900">{user.companyRelationships?.length || 0}</span>
                  </div>
                  <div className="text-sm text-gray-600">レビュー数</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Award className="w-4 h-4 text-purple-500" />
                    <span className="text-xl font-bold text-gray-900">{user.achievements?.length || 0}</span>
                  </div>
                  <div className="text-sm text-gray-600">バッジ数</div>
                </div>
              </div>

              {/* Role and Join Info */}
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge className="bg-gray-100 text-gray-800">
                  {getRoleLabel(user.role || 'other')}
                </Badge>
                {user.joinedDate && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(user.joinedDate).toLocaleDateString('ja-JP')}参加
                  </Badge>
                )}
                {user.lastActive && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(user.lastActive).toLocaleDateString('ja-JP')}最終活動
                  </Badge>
                )}
              </div>

              {/* Bio */}
              {user.bio && (
                <p className="text-gray-700 leading-relaxed">{user.bio}</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Company Relationships */}
            <div className="card p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                会社との関係性
                {user.companyRelationships?.length ? (
                  <span className="text-sm text-gray-500">
                    {filteredCompanyRelationships.length} / {user.companyRelationships.length}件
                  </span>
                ) : null}
              </h2>

              {/* Filter Buttons */}
              {user.companyRelationships && user.companyRelationships.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    onClick={() => setRelationshipFilter('all')}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      relationshipFilter === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    すべて
                  </button>
                  <button
                    onClick={() => setRelationshipFilter(5)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      relationshipFilter === 5
                        ? 'bg-pink-600 text-white'
                        : 'bg-pink-50 text-pink-700 hover:bg-pink-100'
                    }`}
                  >
                    株主
                  </button>
                  <button
                    onClick={() => setRelationshipFilter(4)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      relationshipFilter === 4
                        ? 'bg-orange-600 text-white'
                        : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                    }`}
                  >
                    投資先
                  </button>
                  <button
                    onClick={() => setRelationshipFilter(3)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      relationshipFilter === 3
                        ? 'bg-purple-600 text-white'
                        : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                    }`}
                  >
                    協業先
                  </button>
                  <button
                    onClick={() => setRelationshipFilter(2)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      relationshipFilter === 2
                        ? 'bg-green-600 text-white'
                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                  >
                    取引先
                  </button>
                  <button
                    onClick={() => setRelationshipFilter(1)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      relationshipFilter === 1
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    知人
                  </button>
                  <button
                    onClick={() => setRelationshipFilter(6)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      relationshipFilter === 6
                        ? 'bg-cyan-600 text-white'
                        : 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100'
                    }`}
                  >
                    友達
                  </button>
                  <button
                    onClick={() => setRelationshipFilter(0)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      relationshipFilter === 0
                        ? 'bg-gray-600 text-white'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    未設定
                  </button>
                </div>
              )}

              {filteredCompanyRelationships.length > 0 ? (
                <div className="space-y-4">
                  {filteredCompanyRelationships.map((relationship, index) => (
                    <div key={`${relationship.companySlug}-${index}`} className="rounded-xl border border-ash-line p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                        <div>
                          <Link
                            href={`/company/${relationship.companySlug}`}
                            className="text-base font-semibold text-gray-900 hover:text-blue-600"
                          >
                            {relationship.companyName}
                          </Link>
                          <div className="text-xs text-gray-500">
                            {relationship.createdAt
                              ? `${new Date(relationship.createdAt).toLocaleDateString('ja-JP')}に評価`
                              : '日付情報なし'}
                            {relationship.updatedAt && relationship.updatedAt !== relationship.createdAt && (
                              <span className="ml-2 text-blue-500">
                                (編集済み)
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                            {relationship.relationshipLabel || getRelationshipLabel(relationship.relationshipType)}
                          </span>
                          {isOwnProfile && (
                            <button
                              onClick={() => handleEditEvaluation(relationship)}
                              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                              title="評価を編集"
                            >
                              <Pencil className="w-4 h-4 text-gray-500 hover:text-blue-600" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mb-3">
                        {getRelationshipReason(relationship.relationshipSource, relationship)}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="font-semibold">{(relationship.rating ?? 0).toFixed(1)}</span>
                        </div>
                        <span className="text-gray-400">/ 5.0</span>
                      </div>
                      {relationship.comment && (
                        <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 leading-relaxed">
                          {relationship.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : user.companyRelationships && user.companyRelationships.length > 0 ? (
                <p className="text-gray-500 text-center py-6">
                  このカテゴリーに該当する企業はありません
                </p>
              ) : (
                <p className="text-gray-500 text-center py-6">
                  まだ企業との関係性（評価）が登録されていません
                </p>
              )}
            </div>

            {/* Achievements */}
            <div className="card p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-600" />
                獲得バッジ ({user.achievements?.length || 0})
              </h2>

              {user.achievements && user.achievements.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user.achievements.map((achievement) => {
                    // カテゴリー別の色を決定
                    const getCategoryColor = (category?: string) => {
                      switch (category) {
                        case 'membership':
                          return 'bg-blue-50 border-blue-200';
                        case 'review':
                          return 'bg-purple-50 border-purple-200';
                        case 'quality':
                          return 'bg-green-50 border-green-200';
                        case 'relationship':
                          return 'bg-orange-50 border-orange-200';
                        case 'network':
                          return 'bg-cyan-50 border-cyan-200';
                        case 'special':
                          return 'bg-pink-50 border-pink-200';
                        default:
                          return 'bg-yellow-50 border-yellow-200';
                      }
                    };

                    return (
                      <div
                        key={achievement.id}
                        className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-all hover:shadow-md ${getCategoryColor(achievement.category)}`}
                      >
                        <div className="text-3xl flex-shrink-0">{achievement.badge}</div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-gray-900 mb-0.5">{achievement.title}</h3>
                          <p className="text-xs text-gray-600 mb-1.5 leading-relaxed">{achievement.description}</p>
                          <p className="text-xs text-gray-500 font-medium">
                            {new Date(achievement.earnedDate).toLocaleDateString('ja-JP')}獲得
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">まだバッジを獲得していません</p>
                  <p className="text-xs text-gray-400 mt-1">企業を評価してバッジを獲得しましょう！</p>
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="card p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                最近の活動
              </h2>

              {user.recentActivity && user.recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {user.recentActivity.map((activity) => {
                    return (
                      <div key={activity.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                        {getActivityIcon(activity.type)}
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">
                            {activity.type === 'review' && activity.companySlug ? (
                              <>
                                <Link
                                  href={`/company/${activity.companySlug}`}
                                  className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                                >
                                  {activity.companyName}
                                </Link>
                                を評価しました
                                {activity.rating !== undefined && (
                                  <span className="ml-2 inline-flex items-center gap-1">
                                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                    <span className="font-semibold text-gray-900">{activity.rating.toFixed(1)}</span>
                                  </span>
                                )}
                              </>
                            ) : activity.type === 'badge' ? (
                              <span className="flex items-center gap-2">
                                <span className="text-lg">{activity.badge}</span>
                                <span>{activity.description}</span>
                              </span>
                            ) : (
                              activity.description
                            )}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(activity.date).toLocaleDateString('ja-JP', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">まだ活動がありません</p>
                  <p className="text-xs text-gray-400 mt-1">企業を評価すると活動が記録されます</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Interests */}
            <div className="card p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-blue-600" />
                興味分野
              </h2>
              <div className="flex flex-wrap gap-2">
                {editableInterests.length > 0 ? (
                  editableInterests.map((interest) => (
                    <span
                      key={interest}
                      className="inline-flex items-center gap-2 rounded-full bg-blue-100 text-blue-800 px-3 py-1 text-xs font-semibold"
                    >
                      {interest}
                      {isOwnProfile && (
                        <button
                          type="button"
                          className="text-blue-600 hover:text-blue-800"
                          onClick={() => removeInterest(interest)}
                          aria-label={`${interest} を削除`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">まだ興味分野は設定されていません。</p>
                )}
              </div>
              {isOwnProfile && (
                <div className="mt-4 space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="新しい興味を入力"
                      value={newInterest}
                      onChange={(e) => setNewInterest(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addInterest()
                        }
                      }}
                    />
                    <Button variant="outline" onClick={addInterest} disabled={!newInterest.trim()}>
                      追加
                    </Button>
                  </div>
                  <div className="text-right">
                    <Button
                      size="sm"
                      onClick={handleSaveProfileTags}
                      disabled={savingProfile || !hasProfileChanges}
                    >
                      {savingProfile ? '保存中...' : '変更を保存'}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Skills */}
            <div className="card p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-green-600" />
                スキル
              </h2>
                <div className="flex flex-wrap gap-2">
                  {editableSkills.length > 0 ? (
                    editableSkills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold"
                      >
                        {skill}
                        {isOwnProfile && (
                          <button
                            type="button"
                            className="text-gray-500 hover:text-gray-800"
                            onClick={() => removeSkill(skill)}
                            aria-label={`${skill} を削除`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">まだスキルは設定されていません。</p>
                  )}
                </div>
              {isOwnProfile && (
                <div className="mt-4 space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="新しいスキルを入力"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addSkill()
                        }
                      }}
                    />
                    <Button variant="outline" onClick={addSkill} disabled={!newSkill.trim()}>
                      追加
                    </Button>
                  </div>
                  <div className="text-right">
                    <Button
                      size="sm"
                      onClick={handleSaveProfileTags}
                      disabled={savingProfile || !hasProfileChanges}
                    >
                      {savingProfile ? '保存中...' : '変更を保存'}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Connections Preview */}
            {user.connections && user.connections.length > 0 && (
              <div className="card p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-600" />
                  つながり ({user.connectionCount || 0})
                </h2>
                <div className="space-y-3">
                  {user.connections.slice(0, 3).map((connection) => (
                    <div
                      key={connection.id}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors cursor-default"
                    >
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        {connection.profileImage ? (
                          <img 
                            src={connection.profileImage} 
                            alt={connection.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          connection.name.charAt(0)
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{connection.name}</p>
                        <p className="text-xs text-gray-600">{connection.company}</p>
                      </div>
                    </div>
                  ))}
                  {user.connectionCount && user.connectionCount > 3 && (
                    <p className="text-sm text-gray-500 text-center mt-2">
                      他 {user.connectionCount - 3} 人のつながり
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Evaluation Modal */}
      <EditEvaluationModal
        evaluation={editingEvaluation}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditingEvaluation(null)
        }}
        onSave={handleSaveEvaluation}
      />
    </div>
  )
}
