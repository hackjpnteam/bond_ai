'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/lib/auth'
import Link from 'next/link'
import { 
  Send, Users, Search, MoreVertical, ArrowLeft, MessageCircle, Plus, User
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'

interface User {
  _id: string
  name: string
  email: string
  image?: string
}

interface Conversation {
  _id: string
  participants: User[]
  lastMessage?: {
    content: string
    sender: User
    createdAt: string
    read: boolean
  }
  unreadCount: number
  updatedAt: string
}

interface Message {
  _id: string
  sender: User
  recipient: User
  subject?: string
  content: string
  read: boolean
  readAt?: string
  createdAt: string
  updatedAt: string
}

export default function ChatMessagesPage() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const emitCountUpdates = useCallback(() => {
    if (typeof window === 'undefined') return
    window.dispatchEvent(new Event('messagesUpdated'))
    window.dispatchEvent(new Event('notificationsUpdated'))
  }, [])

  const markMessageNotificationsAsRead = useCallback(async (conversationId: string) => {
    try {
      const response = await fetch('/api/notifications?read=false', {
        credentials: 'include'
      })
      if (!response.ok) return

      const data = await response.json()
      const targetNotifications = (data.notifications || []).filter(
        (notif: any) =>
          notif.type === 'message' &&
          String(notif.data?.senderId || '') === conversationId
      )

      if (targetNotifications.length === 0) return

      await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          notificationIds: targetNotifications.map((notif: any) => notif._id),
          read: true
        })
      })
    } catch (error) {
      console.error('Error marking message notifications as read:', error)
    }
  }, [])

  useEffect(() => {
    if (user) {
      fetchConversations()
    }
  }, [user])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation)
    }
  }, [selectedConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/conversations', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
        setConversations(prev =>
          prev.map(conv =>
            conv._id === conversationId ? { ...conv, unreadCount: 0 } : conv
          )
        )
        await markMessageNotificationsAsRead(conversationId)
        emitCountUpdates()
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMessage.trim() || !selectedConversation) return

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          conversationId: selectedConversation,
          content: newMessage.trim(),
          subject: 'Chat Message'
        })
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(prev => [...prev, data.message])
        setNewMessage('')
        
        // 会話リストを更新
        fetchConversations()
      } else {
        toast.error('メッセージの送信に失敗しました')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('エラーが発生しました')
    }
  }

  const formatTime = (dateString: string) => {
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
      return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
    }
  }

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find(p => p._id !== user?.id)
  }

  const filteredConversations = conversations.filter(conversation => {
    const otherParticipant = getOtherParticipant(conversation)
    return otherParticipant?.name.toLowerCase().includes(searchTerm.toLowerCase())
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-ash-surface/30 flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="w-8 h-8 animate-pulse mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">チャットを読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-ash-surface/30">
      {/* Header */}
      <div className="bg-white border-b border-ash-line">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="lg:hidden">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <h1 className="text-xl font-bold text-gray-900">メッセージ</h1>
            </div>
            <Link href="/messages/compose">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                新規
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <Card className="lg:col-span-1 flex flex-col overflow-hidden">
            {/* Search */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="会話を検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>まだ会話がありません</p>
                  <Link href="/messages/compose">
                    <Button variant="outline" className="mt-2" size="sm">
                      新しい会話を開始
                    </Button>
                  </Link>
                </div>
              ) : (
                filteredConversations.map((conversation) => {
                  const otherParticipant = getOtherParticipant(conversation)
                  if (!otherParticipant) return null

                  return (
                    <div
                      key={conversation._id}
                      onClick={() => setSelectedConversation(conversation._id)}
                      className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedConversation === conversation._id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold overflow-hidden flex-shrink-0">
                          <img
                            src={otherParticipant.image || '/default-avatar.png'}
                            alt={otherParticipant.name}
                            className="w-full h-full rounded-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/default-avatar.png';
                            }}
                          />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              {otherParticipant.name}
                            </h3>
                            <div className="flex items-center gap-2">
                              {conversation.lastMessage && (
                                <span className="text-xs text-gray-500">
                                  {formatTime(conversation.lastMessage.createdAt)}
                                </span>
                              )}
                              {conversation.unreadCount > 0 && (
                                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] h-5 flex items-center justify-center">
                                  {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {conversation.lastMessage && (
                            <p className="text-sm text-gray-600 truncate mt-1">
                              {conversation.lastMessage.content}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2 flex flex-col overflow-hidden">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const conversation = conversations.find(c => c._id === selectedConversation)
                      const otherParticipant = conversation ? getOtherParticipant(conversation) : null
                      return otherParticipant ? (
                        <>
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                            <img
                              src={otherParticipant.image || '/default-avatar.png'}
                              alt={otherParticipant.name}
                              className="w-full h-full rounded-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/default-avatar.png';
                              }}
                            />
                          </div>
                          <h2 className="text-sm font-medium text-gray-900">{otherParticipant.name}</h2>
                        </>
                      ) : null
                    })()}
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => {
                    const isFromCurrentUser = message.sender._id === user?.id
                    
                    return (
                      <div
                        key={message._id}
                        className={`flex items-start gap-3 ${
                          isFromCurrentUser ? 'flex-row-reverse' : 'flex-row'
                        }`}
                      >
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold overflow-hidden flex-shrink-0">
                          <img
                            src={message.sender.image || '/default-avatar.png'}
                            alt={message.sender.name}
                            className="w-full h-full rounded-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/default-avatar.png';
                            }}
                          />
                        </div>
                        
                        <div className={`max-w-xs lg:max-w-md ${
                          isFromCurrentUser ? 'text-right' : 'text-left'
                        }`}>
                          <div className={`inline-block px-4 py-2 rounded-2xl ${
                            isFromCurrentUser 
                              ? 'bg-blue-600 text-white rounded-br-md' 
                              : 'bg-gray-100 text-gray-900 rounded-bl-md'
                          }`}>
                            <p className={`text-sm whitespace-pre-wrap ${
                              isFromCurrentUser ? 'text-white' : 'text-gray-900'
                            }`}>{message.content}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 px-2">
                            {formatTime(message.createdAt)}
                            {isFromCurrentUser && !message.read && (
                              <span className="ml-2 text-blue-500">未読</span>
                            )}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <form onSubmit={sendMessage} className="p-4 border-t">
                  <div className="flex items-end gap-3">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="メッセージを入力..."
                      className="flex-1 min-h-[44px] max-h-32 resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          sendMessage(e)
                        }
                      }}
                    />
                    <Button type="submit" disabled={!newMessage.trim()} className="bg-blue-600 hover:bg-blue-700">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">会話を選択してください</p>
                  <p className="text-sm">左側から会話を選んでチャットを開始</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
