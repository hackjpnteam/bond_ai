'use client'

import { useState, useEffect } from 'react'
import { 
  Users, UserPlus, UserCheck, UserX, Clock, CheckCircle, 
  XCircle, ArrowLeft, Loader2, MessageCircle
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import Link from 'next/link'

interface ConnectionRequest {
  id: string
  fromUser: {
    id: string
    username: string
    name: string
    company?: string
    profileImage?: string
  }
  toUser: {
    id: string
    username: string
    name: string
    company?: string
    profileImage?: string
  }
  status: 'pending' | 'accepted' | 'declined' | 'blocked'
  message?: string
  createdAt: string
  updatedAt: string
}

interface ConnectionStats {
  total: number
  pending: number
  accepted: number
  declined: number
}

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<ConnectionRequest[]>([])
  const [stats, setStats] = useState<ConnectionStats>({ total: 0, pending: 0, accepted: 0, declined: 0 })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'accepted' | 'sent'>('all')
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    fetchConnections()
  }, [activeTab])

  const fetchConnections = async () => {
    try {
      let url = '/api/connections?userId=current-user'
      
      if (activeTab === 'pending') {
        url += '&status=pending&type=received'
      } else if (activeTab === 'accepted') {
        url += '&status=accepted'
      } else if (activeTab === 'sent') {
        url += '&type=sent'
      }

      const response = await fetch(url)
      
      if (response.ok) {
        const data = await response.json()
        setConnections(data.connections)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching connections:', error)
      toast.error('接続データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleConnectionResponse = async (connectionId: string, status: 'accepted' | 'declined') => {
    setProcessingId(connectionId)
    try {
      const response = await fetch(`/api/connections/${connectionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message)
        fetchConnections() // Refresh the list
      } else {
        const error = await response.json()
        toast.error(error.error || 'ステータス更新に失敗しました')
      }
    } catch (error) {
      console.error('Error updating connection:', error)
      toast.error('ネットワークエラーが発生しました')
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">保留中</Badge>
      case 'accepted':
        return <Badge className="bg-green-100 text-green-800">承認済み</Badge>
      case 'declined':
        return <Badge className="bg-red-100 text-red-800">拒否</Badge>
      case 'blocked':
        return <Badge className="bg-gray-100 text-gray-800">ブロック済み</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">不明</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />
      case 'accepted':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'declined':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'blocked':
        return <UserX className="w-4 h-4 text-gray-600" />
      default:
        return <Users className="w-4 h-4 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-ash-surface/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">接続データを読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-ash-surface/30">
      {/* Header */}
      <div className="bg-white border-b border-ash-line">
        <div className="container-narrow mx-auto px-4 py-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4" />
            ホームに戻る
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">
                接続管理
              </h1>
              <p className="text-gray-600">
                あなたの接続リクエストと既存の接続を管理
              </p>
            </div>
            <Link href="/users" className="btn-dark">
              <UserPlus className="w-4 h-4 mr-2" />
              新しい接続を探す
            </Link>
          </div>
        </div>
      </div>

      <div className="container-narrow mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="w-5 h-5 text-blue-500" />
                <span className="text-2xl font-bold text-gray-900">{stats.total}</span>
              </div>
              <div className="text-sm text-gray-600">総接続数</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-yellow-500" />
                <span className="text-2xl font-bold text-gray-900">{stats.pending}</span>
              </div>
              <div className="text-sm text-gray-600">保留中</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-2xl font-bold text-gray-900">{stats.accepted}</span>
              </div>
              <div className="text-sm text-gray-600">承認済み</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <XCircle className="w-5 h-5 text-red-500" />
                <span className="text-2xl font-bold text-gray-900">{stats.declined}</span>
              </div>
              <div className="text-sm text-gray-600">拒否済み</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg max-w-2xl">
          {[
            { key: 'all', label: 'すべて', count: stats.total },
            { key: 'pending', label: '保留中', count: stats.pending },
            { key: 'accepted', label: '承認済み', count: stats.accepted },
            { key: 'sent', label: '送信済み', count: 0 }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Connections List */}
        <div className="space-y-4">
          {connections.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {activeTab === 'pending' ? '保留中の接続リクエストはありません' : 
                   activeTab === 'sent' ? '送信した接続リクエストはありません' :
                   activeTab === 'accepted' ? '承認済みの接続はありません' :
                   '接続がありません'}
                </h3>
                <p className="text-gray-600 mb-4">
                  新しい人とつながって、ネットワークを広げましょう
                </p>
                <Link href="/users" className="btn-dark">
                  <UserPlus className="w-4 h-4 mr-2" />
                  ユーザーを探す
                </Link>
              </CardContent>
            </Card>
          ) : (
            connections.map((connection) => {
              const isReceived = connection.toUser.id === 'current-user'
              const otherUser = isReceived ? connection.fromUser : connection.toUser
              
              return (
                <Card key={connection.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {otherUser.profileImage ? (
                            <img 
                              src={otherUser.profileImage} 
                              alt={otherUser.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            otherUser.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{otherUser.name}</h3>
                            {getStatusBadge(connection.status)}
                          </div>
                          <p className="text-sm text-gray-600">{otherUser.company}</p>
                          <p className="text-xs text-gray-500">
                            {isReceived ? '接続リクエストを受信' : '接続リクエストを送信'} - {new Date(connection.createdAt).toLocaleDateString('ja-JP')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {getStatusIcon(connection.status)}
                      </div>
                    </div>

                    {connection.message && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <MessageCircle className="w-4 h-4 text-gray-600" />
                          <span className="text-sm font-medium text-gray-700">メッセージ</span>
                        </div>
                        <p className="text-sm text-gray-700">{connection.message}</p>
                      </div>
                    )}

                    {connection.status === 'pending' && isReceived && (
                      <div className="mt-4 flex gap-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleConnectionResponse(connection.id, 'accepted')}
                          disabled={processingId === connection.id}
                        >
                          {processingId === connection.id ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-1" />
                          ) : (
                            <UserCheck className="w-4 h-4 mr-1" />
                          )}
                          承認
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleConnectionResponse(connection.id, 'declined')}
                          disabled={processingId === connection.id}
                        >
                          {processingId === connection.id ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-1" />
                          ) : (
                            <UserX className="w-4 h-4 mr-1" />
                          )}
                          拒否
                        </Button>
                      </div>
                    )}

                    {connection.status === 'accepted' && (
                      <div className="mt-4">
                        <Link href={`/users/${otherUser.username}`} className="btn-ol">
                          プロフィールを見る
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}