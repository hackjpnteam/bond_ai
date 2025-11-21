'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/auth'
import Link from 'next/link'
import { 
  Send, Users, Search, MoreVertical, ArrowLeft, MessageCircle, Plus, User
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'

interface Message {
  _id: string
  sender: {
    _id: string
    name: string
    email: string
    image?: string
  }
  recipient: {
    _id: string
    name: string
    email: string
    image?: string
  }
  subject: string
  content: string
  read: boolean
  readAt?: string
  createdAt: string
  updatedAt: string
}

export default function MessagesPage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // received | sent | all
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)

  // ページが表示されるたびに未読メッセージを既読にする
  useEffect(() => {
    if (user && messages.length > 0) {
      markReceivedMessagesAsRead()
    }
  }, [messages, user])

  useEffect(() => {
    if (user) {
      fetchMessages()
    }
  }, [user, filter, page])

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/messages?type=${filter}&page=${page}&limit=20`, {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      } else {
        console.error('Failed to fetch messages')
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const markReceivedMessagesAsRead = async () => {
    if (!user) return

    const unreadMessages = messages.filter(message => 
      !message.read && 
      message.recipient._id.toString() === user.id &&
      filter === 'received'
    )

    if (unreadMessages.length === 0) return

    try {
      // 各未読メッセージを既読にする
      const promises = unreadMessages.map(message =>
        fetch(`/api/messages/${message._id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ read: true })
        })
      )

      await Promise.all(promises)

      // ローカル状態を更新
      setMessages(prev => 
        prev.map(message => 
          unreadMessages.some(um => um._id === message._id) 
            ? { ...message, read: true } 
            : message
        )
      )
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  const deleteMessage = async (messageId: string) => {
    if (!confirm('このメッセージを削除してもよろしいですか？')) {
      return
    }

    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        setMessages(messages.filter(m => m._id !== messageId))
      } else {
        alert('メッセージの削除に失敗しました')
      }
    } catch (error) {
      console.error('Error deleting message:', error)
      alert('エラーが発生しました')
    }
  }

  const filteredMessages = messages.filter(message => {
    if (!searchTerm) return true
    return (
      message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.sender.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.recipient.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  const getMessageTypeIcon = (message: Message) => {
    if (filter === 'sent' || message.sender._id.toString() === user?.id) {
      return <Send className="w-4 h-4 text-blue-600" />
    } else {
      return message.read ? 
        <MailOpen className="w-4 h-4 text-gray-600" /> : 
        <Mail className="w-4 h-4 text-blue-600" />
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return '昨日'
    } else if (diffDays < 7) {
      return `${diffDays}日前`
    } else {
      return date.toLocaleDateString('ja-JP')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-ash-surface/30 flex items-center justify-center">
        <div className="text-center">
          <Mail className="w-8 h-8 animate-pulse mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">メッセージを読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-ash-surface/30">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">メッセージ</h1>
            <p className="text-gray-600">受信・送信メッセージを管理</p>
          </div>
          <Link href="/messages/compose">
            <Button className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              新規作成
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="card p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="メッセージを検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全メッセージ</SelectItem>
                <SelectItem value="received">受信メッセージ</SelectItem>
                <SelectItem value="sent">送信メッセージ</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Messages List */}
        <div className="card">
          {filteredMessages.length > 0 ? (
            <div className="divide-y">
              {filteredMessages.map((message) => (
                <div
                  key={message._id}
                  className={`p-4 sm:p-6 hover:bg-gray-50 transition-colors ${
                    !message.read && message.recipient._id.toString() === user?.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                        <img
                          src={
                            filter === 'sent' || message.sender._id.toString() === user?.id
                              ? message.recipient.image || '/default-avatar.png'
                              : message.sender.image || '/default-avatar.png'
                          }
                          alt="Avatar"
                          className="w-full h-full rounded-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/default-avatar.png';
                          }}
                        />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getMessageTypeIcon(message)}
                          <span className="font-medium text-gray-900">
                            {filter === 'sent' || message.sender._id.toString() === user?.id
                              ? `To: ${message.recipient.name}`
                              : `From: ${message.sender.name}`}
                          </span>
                          {!message.read && message.recipient._id.toString() === user?.id && (
                            <Badge variant="secondary" className="text-xs">未読</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">
                            {formatDate(message.createdAt)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMessage(message._id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <Link href={`/messages/${message._id}`}>
                        <div className="cursor-pointer">
                          <h3 className="font-semibold text-gray-900 mb-1 hover:text-blue-600 transition-colors">
                            {message.subject}
                          </h3>
                          <p className="text-gray-600 text-sm line-clamp-2">
                            {message.content}
                          </p>
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'メッセージが見つかりませんでした' : 'メッセージはありません'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 
                  '検索条件を変更してみてください。' :
                  filter === 'sent' ? 
                    'まだメッセージを送信していません。' :
                    'まだメッセージを受信していません。'
                }
              </p>
              {!searchTerm && (
                <Link href="/messages/compose">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    新規メッセージを作成
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}