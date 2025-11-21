'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Mail, Reply, Trash2, Calendar, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth'
import Link from 'next/link'
import { toast } from 'sonner'

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

export default function MessageDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const messageId = params.id as string
  
  const [message, setMessage] = useState<Message | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (messageId && user) {
      fetchMessage()
    }
  }, [messageId, user])

  const fetchMessage = async () => {
    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        if (response.status === 404) {
          setError('メッセージが見つかりません')
        } else if (response.status === 403) {
          setError('このメッセージにアクセスする権限がありません')
        } else {
          setError('メッセージの読み込みに失敗しました')
        }
        return
      }

      const data = await response.json()
      setMessage(data.message)
    } catch (error) {
      console.error('Error fetching message:', error)
      setError('ネットワークエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!message || !confirm('このメッセージを削除してもよろしいですか？')) {
      return
    }

    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        toast.success('メッセージを削除しました')
        router.push('/messages')
      } else {
        toast.error('メッセージの削除に失敗しました')
      }
    } catch (error) {
      console.error('Error deleting message:', error)
      toast.error('エラーが発生しました')
    }
  }

  const handleReply = () => {
    if (message) {
      const replySubject = message.subject.startsWith('Re: ') ? message.subject : `Re: ${message.subject}`
      const recipientEmail = message.sender._id === user?.id ? message.recipient.email : message.sender.email
      const recipientName = message.sender._id === user?.id ? message.recipient.name : message.sender.name
      
      const composeUrl = `/messages/compose?to=${encodeURIComponent(recipientEmail)}&subject=${encodeURIComponent(replySubject)}&parentId=${message._id}`
      router.push(composeUrl)
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

  if (error || !message) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-ash-surface/30 flex items-center justify-center">
        <div className="text-center">
          <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">メッセージが表示できません</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link href="/messages" className="btn-dark">
            メッセージ一覧に戻る
          </Link>
        </div>
      </div>
    )
  }

  const isFromCurrentUser = message.sender._id.toString() === user?.id
  const otherUser = isFromCurrentUser ? message.recipient : message.sender

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-ash-surface/30">
      {/* Header */}
      <div className="bg-white border-b border-ash-line">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/messages" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4" />
            メッセージ一覧に戻る
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">メッセージ詳細</h1>
            <div className="flex gap-2">
              <Button onClick={handleReply} className="bg-blue-600 hover:bg-blue-700">
                <Reply className="w-4 h-4 mr-2" />
                返信
              </Button>
              <Button onClick={handleDelete} variant="outline" className="text-red-600 hover:text-red-700 border-red-300">
                <Trash2 className="w-4 h-4 mr-2" />
                削除
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                  <img
                    src={otherUser.image || '/default-avatar.png'}
                    alt={otherUser.name}
                    className="w-full h-full rounded-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/default-avatar.png';
                    }}
                  />
                </div>
              </div>

              {/* Message Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl mb-2">{message.subject}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>
                          {isFromCurrentUser ? `To: ${otherUser.name}` : `From: ${otherUser.name}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(message.createdAt).toLocaleString('ja-JP')}</span>
                      </div>
                    </div>
                  </div>
                  
                  {!message.read && message.recipient._id.toString() === user?.id && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">未読</span>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                {message.content}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}