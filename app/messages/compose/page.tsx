'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import Link from 'next/link'
import { ArrowLeft, Send, User, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface UserSuggestion {
  _id: string
  name: string
  email: string
  username?: string
  image?: string
}

export default function ComposeMessagePage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [recipient, setRecipient] = useState('')
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const recipientInputRef = useRef<HTMLInputElement>(null)

  // URL パラメータから初期値を設定
  useEffect(() => {
    const toUser = searchParams.get('to')
    const replySubject = searchParams.get('subject')
    
    if (toUser) {
      setRecipient(toUser)
    }
    
    if (replySubject) {
      setSubject(replySubject.startsWith('Re: ') ? replySubject : `Re: ${replySubject}`)
    }
  }, [searchParams])

  // 受信者候補を検索
  const searchUsers = async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.users || [])
        setShowSuggestions(true)
      }
    } catch (error) {
      console.error('Error searching users:', error)
    }
  }

  const handleRecipientChange = (value: string) => {
    setRecipient(value)
    searchUsers(value)
  }

  const selectUser = (user: UserSuggestion) => {
    setRecipient(user.email)
    setShowSuggestions(false)
    if (recipientInputRef.current) {
      recipientInputRef.current.focus()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!recipient.trim()) {
      toast.error('送信先を入力してください')
      return
    }

    if (!subject.trim()) {
      toast.error('件名を入力してください')
      return
    }

    if (!content.trim()) {
      toast.error('メッセージ本文を入力してください')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          recipientUsername: recipient,
          subject: subject.trim(),
          content: content.trim()
        }),
      })

      if (response.ok) {
        toast.success('メッセージを送信しました')
        router.push('/messages')
      } else {
        const error = await response.json()
        toast.error(error.error || 'メッセージの送信に失敗しました')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('ネットワークエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-ash-surface/30">
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/messages" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4" />
            メッセージ一覧に戻る
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">新規メッセージ</h1>
        </div>

        {/* Form */}
        <div className="card p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 送信先 */}
            <div className="relative">
              <Label htmlFor="recipient" className="block text-sm font-medium text-gray-700 mb-2">
                送信先
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  ref={recipientInputRef}
                  id="recipient"
                  type="text"
                  value={recipient}
                  onChange={(e) => handleRecipientChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="ユーザー名またはメールアドレス"
                  className="pl-10"
                  required
                />
              </div>

              {/* ユーザー候補 */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {suggestions.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer"
                      onClick={() => selectUser(user)}
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                        <img
                          src={user.image || '/default-avatar.png'}
                          alt={user.name}
                          className="w-full h-full rounded-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/default-avatar.png';
                          }}
                        />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-600">{user.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 件名 */}
            <div>
              <Label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                件名
              </Label>
              <Input
                id="subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="メッセージの件名"
                maxLength={200}
                required
              />
              <p className="mt-1 text-xs text-gray-500">{subject.length}/200文字</p>
            </div>

            {/* メッセージ本文 */}
            <div>
              <Label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                メッセージ
              </Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="メッセージの内容を入力してください..."
                className="min-h-[200px]"
                maxLength={2000}
                required
              />
              <p className="mt-1 text-xs text-gray-500">{content.length}/2000文字</p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <Link href="/messages">
                <Button type="button" variant="outline" className="w-full sm:w-auto">
                  キャンセル
                </Button>
              </Link>
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    送信中...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    送信
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}