'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Users, MessageCircle, Clock, CheckCircle, AlertCircle, Plus, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import Link from 'next/link'

interface Introduction {
  id: string
  fromUser: string
  toUser: string
  targetCompany: string
  message: string
  status: 'pending' | 'accepted' | 'declined' | 'completed'
  createdAt: string
  updatedAt: string
}

export default function IntroductionsPage() {
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received')
  const [introductions, setIntroductions] = useState<Introduction[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    introId: string
    action: 'accept' | 'decline'
    introData?: Introduction
  }>({ isOpen: false, introId: '', action: 'accept' })

  // Fetch introductions from API
  useEffect(() => {
    fetchIntroductions()
  }, [])

  const fetchIntroductions = async () => {
    try {
      const response = await fetch('/api/introductions')
      if (response.ok) {
        const data = await response.json()
        setIntroductions(data.introductions)
      }
    } catch (error) {
      console.error('Error fetching introductions:', error)
      toast.error('紹介データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (id: string, status: 'accepted' | 'declined', reason?: string) => {
    setProcessingId(id)
    try {
      const response = await fetch(`/api/introductions/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, reason })
      })

      if (response.ok) {
        const data = await response.json()
        // Update local state
        setIntroductions(prev => 
          prev.map(intro => 
            intro.id === id ? { ...intro, status, updatedAt: new Date().toISOString().split('T')[0] } : intro
          )
        )
        toast.success(data.message)
      } else {
        const error = await response.json()
        toast.error(error.error || 'ステータス更新に失敗しました')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('ネットワークエラーが発生しました')
    } finally {
      setProcessingId(null)
      setConfirmDialog({ isOpen: false, introId: '', action: 'accept' })
    }
  }

  const openConfirmDialog = (intro: Introduction, action: 'accept' | 'decline') => {
    setConfirmDialog({
      isOpen: true,
      introId: intro.id,
      action,
      introData: intro
    })
  }

  const confirmAction = () => {
    const status = confirmDialog.action === 'accept' ? 'accepted' : 'declined'
    handleStatusUpdate(confirmDialog.introId, status)
  }

  const receivedIntroductions = introductions.filter(intro => intro.toUser === 'あなた')
  const sentIntroductions = introductions.filter(intro => intro.fromUser === 'あなた')

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-ash-surface/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">紹介データを読み込み中...</p>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status: Introduction['status']) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">保留中</Badge>
      case 'accepted':
        return <Badge className="bg-blue-100 text-blue-800">承認済み</Badge>
      case 'declined':
        return <Badge className="bg-red-100 text-red-800">辞退</Badge>
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">完了</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">不明</Badge>
    }
  }

  const getStatusIcon = (status: Introduction['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />
      case 'accepted':
        return <CheckCircle className="w-4 h-4 text-blue-600" />
      case 'declined':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />
    }
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
                紹介管理
              </h1>
              <p className="text-gray-600">
                送受信した紹介依頼を管理します
              </p>
            </div>
            <Link href="/referral-routes" className="btn-dark">
              <Plus className="w-4 h-4 mr-2" />
              新しい紹介を依頼
            </Link>
          </div>
        </div>
      </div>

      <div className="container-narrow mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg max-w-md">
          <button
            onClick={() => setActiveTab('received')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'received'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            受信した紹介 ({receivedIntroductions.length})
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'sent'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            送信した紹介 ({sentIntroductions.length})
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {activeTab === 'received' && (
            <>
              {receivedIntroductions.length === 0 ? (
                <div className="text-center py-12 card">
                  <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    受信した紹介はありません
                  </h3>
                  <p className="text-gray-600">
                    他のユーザーからの紹介依頼がここに表示されます
                  </p>
                </div>
              ) : (
                receivedIntroductions.map((intro) => (
                  <div key={intro.id} className="card p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {intro.fromUser}からの紹介依頼
                          </h3>
                          <p className="text-sm text-gray-600">
                            {intro.targetCompany}への紹介
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(intro.status)}
                        {getStatusBadge(intro.status)}
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageCircle className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">メッセージ</span>
                      </div>
                      <p className="text-sm text-gray-700">{intro.message}</p>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>受信日: {intro.createdAt}</span>
                      {intro.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-red-600 hover:text-red-700"
                            onClick={() => openConfirmDialog(intro, 'decline')}
                            disabled={processingId === intro.id}
                          >
                            辞退
                          </Button>
                          <Button 
                            size="sm" 
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => openConfirmDialog(intro, 'accept')}
                            disabled={processingId === intro.id}
                          >
                            承認
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {activeTab === 'sent' && (
            <>
              {sentIntroductions.length === 0 ? (
                <div className="text-center py-12 card">
                  <MessageCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    送信した紹介はありません
                  </h3>
                  <p className="text-gray-600 mb-4">
                    まだ紹介依頼を送信していません
                  </p>
                  <Link href="/referral-routes" className="btn-dark">
                    新しい紹介を依頼
                  </Link>
                </div>
              ) : (
                sentIntroductions.map((intro) => (
                  <div key={intro.id} className="card p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <MessageCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {intro.toUser}への紹介依頼
                          </h3>
                          <p className="text-sm text-gray-600">
                            {intro.targetCompany}への紹介
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(intro.status)}
                        {getStatusBadge(intro.status)}
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageCircle className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">送信したメッセージ</span>
                      </div>
                      <p className="text-sm text-gray-700">{intro.message}</p>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>送信日: {intro.createdAt}</span>
                      {intro.status === 'completed' && (
                        <span className="text-green-600 font-medium">
                          紹介完了済み
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>

        {/* Statistics */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {receivedIntroductions.length}
            </div>
            <div className="text-sm text-gray-600">受信した紹介</div>
          </div>
          <div className="text-center p-6 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {sentIntroductions.filter(intro => intro.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-600">成功した紹介</div>
          </div>
          <div className="text-center p-6 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round((sentIntroductions.filter(intro => intro.status === 'completed').length / Math.max(sentIntroductions.length, 1)) * 100)}%
            </div>
            <div className="text-sm text-gray-600">成功率</div>
          </div>
        </div>

        {/* Confirmation Dialog */}
        {confirmDialog.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-bold mb-4">
                {confirmDialog.action === 'accept' ? '紹介を承認しますか？' : '紹介を辞退しますか？'}
              </h3>
              
              {confirmDialog.introData && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>依頼者:</strong> {confirmDialog.introData.fromUser}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>対象企業:</strong> {confirmDialog.introData.targetCompany}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>メッセージ:</strong> {confirmDialog.introData.message}
                  </p>
                </div>
              )}
              
              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline"
                  onClick={() => setConfirmDialog({ isOpen: false, introId: '', action: 'accept' })}
                  disabled={processingId === confirmDialog.introId}
                >
                  キャンセル
                </Button>
                <Button 
                  className={confirmDialog.action === 'accept' 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-red-600 hover:bg-red-700'
                  }
                  onClick={confirmAction}
                  disabled={processingId === confirmDialog.introId}
                >
                  {processingId === confirmDialog.introId ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  {confirmDialog.action === 'accept' ? '承認する' : '辞退する'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}