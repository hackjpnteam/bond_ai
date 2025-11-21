'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Bell, Star, Users, TrendingUp, MessageCircle, Check, X, Filter, UserPlus, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth'

interface Notification {
  _id: string
  recipient: string
  type: string
  title: string
  message: string
  data?: any
  read: boolean
  createdAt: string
  updatedAt: string
}

// ダミー通知データ
const dummyNotifications = [
  {
    id: '1',
    type: 'badge',
    title: '新しいバッジを獲得しました！',
    message: '「評価王」バッジを獲得しました。10社以上の企業評価を達成おめでとうございます！',
    time: '5分前',
    read: false,
    icon: Star,
    color: 'yellow'
  },
  {
    id: '2',
    type: 'review',
    title: '新しいレビューが投稿されました',
    message: 'ギグーに対するあなたの評価に新しいコメントが追加されました。',
    time: '1時間前',
    read: false,
    icon: MessageCircle,
    color: 'blue'
  },
  {
    id: '3',
    type: 'connection',
    title: '新しい接続リクエスト',
    message: '山田花子さんから接続リクエストが届きました。',
    time: '3時間前',
    read: false,
    icon: Users,
    color: 'green'
  },
  {
    id: '4',
    type: 'update',
    title: '企業情報が更新されました',
    message: 'フォローしているStartupHubの企業情報が更新されました。',
    time: '6時間前',
    read: true,
    icon: TrendingUp,
    color: 'purple'
  },
  {
    id: '5',
    type: 'system',
    title: 'システムメンテナンスのお知らせ',
    message: '明日午前2時〜4時にシステムメンテナンスを実施いたします。',
    time: '1日前',
    read: true,
    icon: Bell,
    color: 'gray'
  },
  {
    id: '6',
    type: 'achievement',
    title: '月間目標を達成しました！',
    message: '今月の評価目標5社を達成しました。来月も頑張りましょう！',
    time: '2日前',
    read: true,
    icon: Star,
    color: 'orange'
  }
]

export default function NotificationsPage() {
  const [notificationList, setNotificationList] = useState<any[]>([])
  const [connectionRequests, setConnectionRequests] = useState<any[]>([])
  const [filter, setFilter] = useState('all') // all, unread, read
  const [loading, setLoading] = useState(true)
  const [processingRequest, setProcessingRequest] = useState<string | null>(null)
  const { user } = useAuth()
  const emitNotificationUpdate = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('notificationsUpdated'))
    }
  }

  useEffect(() => {
    if (user) {
      fetchNotifications()
      fetchConnectionRequests()
    }
  }, [user])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setNotificationList(data.notifications || [])
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchConnectionRequests = async () => {
    try {
      const response = await fetch('/api/connection-requests?type=received', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setConnectionRequests(data.requests || [])
      }
    } catch (error) {
      console.error('Error fetching connection requests:', error)
    }
  }

  const handleConnectionRequest = async (requestId: string, action: 'accept' | 'reject') => {
    setProcessingRequest(requestId)
    try {
      const response = await fetch(`/api/connection-requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ action })
      })

      if (response.ok) {
        toast.success(
          action === 'accept' 
            ? '接続リクエストを承認しました' 
            : '接続リクエストを拒否しました'
        )
        
        setConnectionRequests(prev => prev.filter(req => req._id !== requestId))
        
        if (action === 'accept') {
          setTimeout(() => {
            window.location.href = '/trust-map'
          }, 1500)
        }
      } else {
        throw new Error('Failed to process request')
      }
    } catch (error) {
      console.error('Error processing connection request:', error)
      toast.error('リクエストの処理に失敗しました')
    } finally {
      setProcessingRequest(null)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        credentials: 'include'
      })
      
      setNotificationList(prev => 
        prev.map(notif => 
          notif._id === id ? { ...notif, read: true } : notif
        )
      )
      toast.success('既読にしました')
      emitNotificationUpdate()
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const handleNotificationClick = (notification: any) => {
    // 通知を既読にする
    if (!notification.read) {
      markAsRead(notification._id)
    }

    // 通知タイプに応じてページ遷移
    if (notification.type === 'message') {
      if (notification.data?.messageId) {
        // 特定のメッセージページに遷移
        window.location.href = `/messages/${notification.data.messageId}`
      } else {
        // メッセージ一覧に遷移
        window.location.href = '/messages'
      }
    } else if (notification.type === 'connection_accepted') {
      window.location.href = '/trust-map'
    } else if (notification.type === 'evaluation') {
      window.location.href = '/companies'
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notificationList.filter(notif => !notif.read)
        
      if (unreadNotifications.length > 0) {
        // 各通知を個別に既読にする
        const promises = unreadNotifications.map(notif => 
          fetch(`/api/notifications/${notif._id}/read`, {
            method: 'PUT',
            credentials: 'include'
          })
        )
        
        await Promise.all(promises)
        
        setNotificationList(prev => 
          prev.map(notif => ({ ...notif, read: true }))
        )
        toast.success('すべて既読にしました')
        emitNotificationUpdate()
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const deleteNotification = (id: string) => {
    setNotificationList(prev => prev.filter(notif => notif._id !== id))
    toast.success('通知を削除しました')
  }

  const allItems = [...notificationList, ...connectionRequests.map(req => ({
    _id: req._id,
    type: 'connection_request',
    title: '新しい接続リクエスト',
    message: `${req.requester?.name || 'ユーザー'}さんから接続リクエストが届きました`,
    data: req,
    read: false,
    createdAt: req.createdAt,
    icon: UserPlus,
    color: 'green'
  }))]

  const filteredNotifications = allItems.filter(notif => {
    if (filter === 'unread') return !notif.read
    if (filter === 'read') return notif.read
    return true
  })

  const unreadCount = allItems.filter(notif => !notif.read).length

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-ash-surface/30">
      {/* Header */}
      <div className="bg-white border-b border-ash-line">
        <div className="container-narrow mx-auto px-4 py-6">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4" />
            マイページに戻る
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">
                通知
              </h1>
              <p className="text-gray-600">
                {unreadCount > 0 ? `${unreadCount}件の未読通知があります` : 'すべての通知を確認済みです'}
              </p>
            </div>
            {unreadCount > 0 && (
              <Button onClick={markAllAsRead} variant="outline">
                すべて既読にする
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container-narrow mx-auto px-4 py-8">
        {/* フィルター */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">フィルター:</span>
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                すべて ({notificationList.length})
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unread')}
              >
                未読 ({unreadCount})
              </Button>
              <Button
                variant={filter === 'read' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('read')}
              >
                既読 ({notificationList.length - unreadCount})
              </Button>
            </div>
          </div>
        </div>

        {/* 接続リクエスト */}
        {connectionRequests.length > 0 && filter !== 'read' && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">接続リクエスト</h2>
            <div className="space-y-4">
              {connectionRequests.map((request) => (
                <Card 
                  key={request._id}
                  className="bg-green-50 border-green-200"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold">
                          {request.requester?.profileImage ? (
                            <img 
                              src={request.requester.profileImage} 
                              alt={request.requester.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            request.requester?.name?.charAt(0) || 'U'
                          )}
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">
                            {request.requester?.name || 'ユーザー'}さんから接続リクエスト
                          </h3>
                          <p className="text-sm text-gray-600">
                            {request.requester?.company} • {request.requester?.position}
                          </p>
                          {request.message && (
                            <p className="text-sm text-gray-500 mt-1">{request.message}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleConnectionRequest(request._id, 'accept')}
                          disabled={processingRequest === request._id}
                        >
                          {processingRequest === request._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Check className="w-4 h-4 mr-1" />
                              承認
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleConnectionRequest(request._id, 'reject')}
                          disabled={processingRequest === request._id}
                        >
                          <X className="w-4 h-4 mr-1" />
                          拒否
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 通知一覧 */}
        <div className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">通知を読み込み中...</span>
              </CardContent>
            </Card>
          ) : filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {filter === 'unread' ? '未読の通知はありません' : 
                     filter === 'read' ? '既読の通知はありません' : 
                     '通知はありません'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications
              .filter(notif => notif.type !== 'connection_request')
              .map((notification) => {
                const IconComponent = notification.type === 'message' ? MessageCircle : 
                                     notification.icon || Bell
                const timeAgo = notification.createdAt ? 
                  new Date(notification.createdAt).toLocaleString('ja-JP') : 
                  notification.time
                  
                return (
                  <Card 
                    key={notification._id} 
                    className={`transition-all hover:shadow-md cursor-pointer ${
                      !notification.read ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          notification.type === 'connection_accepted' ? 'bg-green-100' :
                          notification.type === 'evaluation' ? 'bg-purple-100' :
                          notification.type === 'message' ? 'bg-blue-100' :
                          'bg-gray-100'
                        }`}>
                          <IconComponent className={`w-5 h-5 ${
                            notification.type === 'connection_accepted' ? 'text-green-600' :
                            notification.type === 'evaluation' ? 'text-purple-600' :
                            notification.type === 'message' ? 'text-blue-600' :
                            'text-gray-600'
                          }`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-sm font-medium text-gray-900 mb-1">
                                {notification.title}
                                {!notification.read && (
                                  <Badge className="ml-2 bg-blue-500 text-white text-xs">新着</Badge>
                                )}
                              </h3>
                              <p className="text-gray-600 text-sm mb-2">{notification.message}</p>
                              <p className="text-gray-400 text-xs">{timeAgo}</p>
                            </div>
                            
                            <div className="flex items-center gap-2 ml-4">
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    markAsRead(notification._id)
                                  }}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteNotification(notification._id)
                                }}
                                className="text-red-600 hover:text-red-800"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
          )}
        </div>

        {/* 通知設定へのリンク */}
        <div className="mt-8 text-center">
          <Card>
            <CardContent className="p-6">
              <Bell className="w-8 h-8 text-gray-400 mx-auto mb-4" />
              <h3 className="font-medium mb-2">通知設定をカスタマイズ</h3>
              <p className="text-gray-600 text-sm mb-4">
                受け取りたい通知の種類や頻度を設定できます
              </p>
              <Link href="/settings">
                <Button variant="outline">
                  設定ページに移動
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
