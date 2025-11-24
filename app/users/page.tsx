'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Search, Filter, Users, Star, Building2, Award, MapPin, Loader2, UserPlus, Check, X } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { toast } from 'sonner'
import { LockedFeature } from '@/components/OnboardingBanner'

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
  trustScore?: number
  connectionCount?: number
  reviewCount?: number
  badgeCount?: number
  joinedDate?: string
  lastActive?: string
  isPublic?: boolean
  interests?: string[]
  skills?: string[]
  connectionStatus?: 'none' | 'pending' | 'connected' | 'received'
  connectionRequestId?: string
}

// Role translation map
const roleTranslation = {
  'founder': '創業者',
  'investor': '投資家', 
  'employee': '従業員',
  'advisor': 'アドバイザー',
  'other': 'その他'
}

const getRoleLabel = (role?: string | null) => {
  if (!role) return 'その他'
  return roleTranslation[role as keyof typeof roleTranslation] || role
}

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sendingRequest, setSendingRequest] = useState<string | null>(null)
  const [availableRoles, setAvailableRoles] = useState<string[]>([])
  const [hasInitialized, setHasInitialized] = useState(false)
  const [isRefetching, setIsRefetching] = useState(false)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const { user } = useAuth()
  const lastQueryRef = useRef({ search: '', role: 'all' })

  const fetchUsers = useCallback(async (search?: string, role?: string, initial = false) => {
    const normalizedSearch = search?.trim() || ''
    const normalizedRole = role || 'all'
    const params = new URLSearchParams()
    if (normalizedSearch) params.set('search', normalizedSearch)
    if (normalizedRole !== 'all') params.set('role', normalizedRole)

    try {
      if (initial) {
        setLoading(true)
      } else {
        setIsRefetching(true)
      }
      const queryString = params.toString()
      const response = await fetch(`/api/users${queryString ? `?${queryString}` : ''}`, {
        credentials: 'include'
      })
      if (!response.ok) {
        throw new Error('ユーザーデータの取得に失敗しました')
      }
      const data = await response.json()
      setUsers(data.users || [])
      setAvailableRoles(data.availableRoles || [])
      setError(null)
      lastQueryRef.current = { search: normalizedSearch, role: normalizedRole }
    } catch (fetchError) {
      console.error('Error fetching users:', fetchError)
      setError('ユーザーデータの取得に失敗しました')
    } finally {
      if (initial) {
        setLoading(false)
      } else {
        setIsRefetching(false)
      }
    }
  }, [])

  useEffect(() => {
    fetchUsers('', 'all', true).finally(() => setHasInitialized(true))
  }, [fetchUsers])

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim())
    }, 400)
    return () => clearTimeout(handler)
  }, [searchTerm])

  useEffect(() => {
    if (!hasInitialized) return
    const normalizedSearch = debouncedSearch
    const normalizedRole = roleFilter
    if (
      lastQueryRef.current.search === normalizedSearch &&
      lastQueryRef.current.role === normalizedRole
    ) {
      return
    }
    fetchUsers(normalizedSearch, normalizedRole)
  }, [debouncedSearch, roleFilter, hasInitialized, fetchUsers])

  const roleOptions = ['all', ...(availableRoles.length
    ? availableRoles
    : Array.from(new Set(
        users
          .map(user => user.role)
          .filter((role): role is NonNullable<UserProfile['role']> => Boolean(role))
      )))]

  const sendConnectionRequest = async (userId: string) => {
    if (!user) {
      toast.error('接続リクエストを送信するにはログインしてください')
      return
    }

    setSendingRequest(userId)
    try {
      const response = await fetch('/api/connection-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          recipientId: userId,
          message: `${user?.name || 'ユーザー'}さんと繋がりたいと思います。よろしくお願いします。`
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send connection request')
      }

      toast.success('接続リクエストを送信しました')

      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, connectionStatus: 'pending' }
          : user
      ))
    } catch (error: any) {
      console.error('Error sending connection request:', error)
      const errorMessage = error.message === 'Already connected with this user' 
        ? 'すでにこのユーザーと接続されています'
        : error.message === 'Connection request already exists'
        ? '接続リクエストはすでに送信済みです'
        : '接続リクエストの送信に失敗しました'
      toast.error(errorMessage)
    } finally {
      setSendingRequest(null)
    }
  }

  const getConnectionButton = (userProfile: UserProfile) => {
    if (!user) {
      return (
        <Link href="/login">
          <Button size="sm" variant="outline">
            <UserPlus className="w-4 h-4 mr-1" />
            繋がる
          </Button>
        </Link>
      )
    }

    if (userProfile.email === user?.email) {
      return null
    }

    switch (userProfile.connectionStatus) {
      case 'connected':
        return (
          <Button size="sm" variant="outline" disabled>
            <Check className="w-4 h-4 mr-1" />
            接続済み
          </Button>
        )
      case 'pending':
        return (
          <Button size="sm" variant="outline" disabled>
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            リクエスト中
          </Button>
        )
      case 'received':
        return (
          <Link href="/notifications">
            <Button size="sm" className="bg-green-600 hover:bg-green-700">
              <Check className="w-4 h-4 mr-1" />
              承認する
            </Button>
          </Link>
        )
      default:
        return (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => sendConnectionRequest(userProfile.id)}
            disabled={sendingRequest === userProfile.id}
          >
            {sendingRequest === userProfile.id ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4 mr-1" />
            )}
            繋がる
          </Button>
        )
    }
  }

  return (
    <LockedFeature featureName="ユーザーディレクトリ">
    <div className="min-h-screen bg-gradient-to-b from-white to-ash-surface/30">
      {/* Header */}
      <div className="bg-white border-b border-ash-line">
        <div className="container-narrow mx-auto px-4 py-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4" />
            ホームに戻る
          </Link>
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">
            ユーザーディレクトリ
          </h1>
          <p className="text-gray-600">
            Bond Launchコミュニティのメンバーを探索し、つながりを築きましょう
          </p>
        </div>
      </div>

      <div className="container-narrow mx-auto px-4 py-8">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">ユーザーを読み込み中...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <div className="text-red-600 mb-4">{error}</div>
            <Button onClick={() => fetchUsers(searchTerm, roleFilter, true)} variant="outline">
              再試行
            </Button>
          </div>
        )}

        {/* Search and Filters */}
        {!loading && !error && (
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  検索・フィルター
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      名前・会社名・専門分野で検索
                    </label>
                    <Input
                      placeholder="検索キーワードを入力..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      役職で絞り込み
                    </label>
                    <select 
                      className="w-full px-3 py-2 border rounded-md"
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                    >
                      <option value="all">すべての役職</option>
                      {roleOptions.filter(role => role !== 'all').map(role => (
                        <option key={role} value={role}>
                          {getRoleLabel(role)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}


        {/* User Grid */}
        {!loading && !error && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                メンバー一覧 ({users.length}人)
                {isRefetching && (
                  <span className="flex items-center text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    更新中
                  </span>
                )}
              </h2>
            </div>

            {users.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      検索条件に一致するユーザーが見つかりませんでした
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map((user) => (
                  <Card key={user.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold overflow-hidden">
                          <img
                            src={user.profileImage || `/avatars/${user.username || 'default'}.jpg`}
                            alt={user.name}
                            className="w-full h-full rounded-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.parentElement!.innerHTML = user.name.charAt(0);
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg text-gray-900 mb-1">
                            {user.name}
                          </h3>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {getRoleLabel(user.role || 'other')}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{user.company}</p>
                          <p className="text-xs text-blue-600">{user.position}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-4 text-center text-xs">
                        <div>
                          <div className="font-semibold text-purple-600">{user.trustScore || 0}</div>
                          <div className="text-gray-500">信頼スコア</div>
                        </div>
                        <div>
                          <div className="font-semibold text-blue-600">{user.reviewCount || 0}</div>
                          <div className="text-gray-500">レビュー数</div>
                        </div>
                        <div>
                          <div className="font-semibold text-green-600">{user.connectionCount || 0}</div>
                          <div className="text-gray-500">接続数</div>
                        </div>
                      </div>

                      {user.interests && user.interests.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-xs font-semibold text-gray-700 mb-2">興味分野</h4>
                          <div className="flex flex-wrap gap-1">
                            {user.interests.slice(0, 3).map((interest, index) => (
                              <Badge
                                key={index}
                                className="text-xs bg-blue-100 text-blue-800 border-blue-300"
                              >
                                {interest}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        {user.joinedDate && (
                          <span className="text-xs text-gray-500">
                            since {new Date(user.joinedDate).toLocaleDateString('ja-JP')}
                          </span>
                        )}
                        <div className="flex items-center gap-2">
                          {getConnectionButton(user)}
                          <Link href={`/users/${user.username || user.name}`}>
                            <Button size="sm" variant="outline">
                              プロフィール
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
    </LockedFeature>
  )
}
