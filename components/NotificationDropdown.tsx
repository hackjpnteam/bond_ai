'use client'

import { useState, useEffect, useRef } from 'react'
import { Check, X, Clock, User, ListPlus, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth'
import Link from 'next/link'

interface Notification {
  _id: string
  type: string
  title: string
  message: string
  read: boolean
  createdAt: string
  metadata?: {
    connectionRequestId?: string
    requesterId?: string
    requesterName?: string
  }
  data?: {
    sharedListId?: string
    shareId?: string
    listTitle?: string
    invitedBy?: {
      id: string
      name: string
    }
  }
}

interface NotificationDropdownProps {
  onClose: () => void
  onNotificationUpdate: () => void
}

export function NotificationDropdown({ onClose, onNotificationUpdate }: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()

  useEffect(() => {
    fetchNotifications()

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const fetchNotifications = async () => {
    if (!user) {
      setLoading(false)
      return
    }
    
    try {
      const response = await fetch('/api/notifications', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConnectionRequest = async (notificationId: string, connectionRequestId: string, action: 'accept' | 'reject') => {
    setProcessingId(notificationId)
    try {
      const response = await fetch(`/api/connection-requests/${connectionRequestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ action })
      })

      if (!response.ok) {
        throw new Error('Failed to process connection request')
      }

      const message = action === 'accept' ? '接続リクエストを承認しました' : '接続リクエストを拒否しました'
      toast.success(message)

      // Remove the notification from the list
      setNotifications(notifications.filter(n => n._id !== notificationId))
      onNotificationUpdate()
    } catch (error: any) {
      console.error('Error processing connection request:', error)
      toast.error('処理中にエラーが発生しました')
    } finally {
      setProcessingId(null)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        credentials: 'include'
      })
      
      setNotifications(notifications.map(n => 
        n._id === notificationId ? { ...n, read: true } : n
      ))
      onNotificationUpdate()
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  return (
    <div 
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
    >
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">通知</h3>
      </div>
      
      <div className="max-h-80 overflow-y-auto">
        {!user ? (
          <div className="p-4 text-center">
            <p className="text-gray-600 mb-3">通知を見るにはログインしてください</p>
            <Link 
              href="/login"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              onClick={onClose}
            >
              ログイン
            </Link>
          </div>
        ) : loading ? (
          <div className="p-4 text-center text-gray-500">
            読み込み中...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            新しい通知はありません
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification._id}
              className={`p-4 border-b border-gray-100 hover:bg-gray-50 ${!notification.read ? 'bg-blue-50' : ''}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  notification.type === 'shared_list_invite'
                    ? 'bg-pink-100'
                    : 'bg-blue-100'
                }`}>
                  {notification.type === 'shared_list_invite' ? (
                    <ListPlus className="w-4 h-4 text-pink-600" />
                  ) : (
                    <User className="w-4 h-4 text-blue-600" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 mb-1">
                    {notification.title}
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">
                    {notification.message}
                  </p>
                  
                  {notification.type === 'connection_request' && notification.metadata?.connectionRequestId && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleConnectionRequest(
                          notification._id,
                          notification.metadata!.connectionRequestId!,
                          'accept'
                        )}
                        disabled={processingId === notification._id}
                        className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        承認
                      </button>
                      <button
                        onClick={() => handleConnectionRequest(
                          notification._id,
                          notification.metadata!.connectionRequestId!,
                          'reject'
                        )}
                        disabled={processingId === notification._id}
                        className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 disabled:opacity-50 flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        拒否
                      </button>
                    </div>
                  )}

                  {notification.type === 'shared_list_invite' && notification.data?.shareId && (
                    <div className="mt-3">
                      <Link
                        href={`/lists/share/${notification.data.shareId}`}
                        onClick={() => {
                          markAsRead(notification._id)
                          onClose()
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-bond-pink to-pink-500 text-white text-xs rounded-lg hover:from-pink-600 hover:to-pink-600 transition-all"
                      >
                        <ExternalLink className="w-3 h-3" />
                        リストを見る
                      </Link>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(notification.createdAt).toLocaleString('ja-JP')}
                    </span>
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification._id)}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        既読にする
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {notifications.length > 0 && (
        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={onClose}
            className="w-full text-center text-sm text-blue-600 hover:text-blue-800"
          >
            すべての通知を見る
          </button>
        </div>
      )}
    </div>
  )
}