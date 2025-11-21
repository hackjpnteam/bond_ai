'use client'

import { useState } from 'react'
import { Rating } from '@/components/Rating'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Star, User, TrendingUp, Briefcase, HelpCircle, Heart } from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'

type UserRole = 'Founder' | 'Employee' | 'Investor' | 'Advisor' | 'Customer' | 'Fan'

interface CompanyRatingWidgetProps {
  companyId: string
  companyName: string
  currentRating: number
  totalRatings: number
}

export function CompanyRatingWidget({ 
  companyId, 
  companyName, 
  currentRating, 
  totalRatings 
}: CompanyRatingWidgetProps) {
  const { data: session } = useSession()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [isAnonymous, setIsAnonymous] = useState<boolean | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const handleSubmit = async () => {
    if (!session) {
      toast.error('ログインしてください')
      return
    }

    if (rating === 0) {
      toast.error('評価を選択してください')
      return
    }

    if (!selectedRole) {
      toast.error('あなたの立場を選択してください')
      return
    }

    if (isAnonymous === null) {
      toast.error('投稿方法（実名/匿名）を選択してください')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, rating, comment, role: selectedRole, isAnonymous })
      })

      const data = await res.json()
      
      if (res.ok) {
        toast.success('評価を投稿しました')
        setRating(0)
        setComment('')
        setSelectedRole(null)
        setIsAnonymous(null)
        setShowForm(false)
        // ページをリロードして最新の評価を表示
        window.location.reload()
      } else {
        toast.error(data.error || '評価の投稿に失敗しました')
      }
    } catch (error) {
      toast.error('エラーが発生しました')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5" />
          {companyName}を評価
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Rating value={currentRating} readonly size="lg" />
            <span className="text-2xl font-bold">{currentRating.toFixed(1)}</span>
          </div>
          <p className="text-sm text-gray-600">{totalRatings}件の評価</p>
        </div>
        
        {session ? (
          !showForm ? (
            <Button 
              onClick={() => setShowForm(true)}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              この企業を評価する
            </Button>
          ) : (
            <div className="space-y-4 pt-4 border-t">
              <div>
                <p className="text-sm font-medium mb-3">あなたの立場</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'Founder' as UserRole, label: '創業者', icon: TrendingUp },
                    { value: 'Employee' as UserRole, label: '従業員', icon: Briefcase },
                    { value: 'Investor' as UserRole, label: '投資家', icon: TrendingUp },
                    { value: 'Advisor' as UserRole, label: 'アドバイザー', icon: HelpCircle },
                    { value: 'Customer' as UserRole, label: '顧客', icon: User },
                    { value: 'Fan' as UserRole, label: 'ファン', icon: Heart },
                  ].map((role) => {
                    const IconComponent = role.icon
                    return (
                      <button
                        key={role.value}
                        onClick={() => setSelectedRole(role.value)}
                        className={`p-2 rounded-lg border text-xs transition-all ${
                          selectedRole === role.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <IconComponent className="w-3 h-3" />
                          <span>{role.label}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-3">あなたの評価</p>
                <div className="flex justify-center">
                  <Rating 
                    value={rating} 
                    onChange={setRating}
                    size="lg"
                  />
                </div>
                {rating > 0 && (
                  <p className="text-center text-sm text-gray-600 mt-2 font-medium">
                    {rating === 5 && "素晴らしい！"}
                    {rating === 4 && "とても良い"}
                    {rating === 3 && "良い"}
                    {rating === 2 && "まあまあ"}
                    {rating === 1 && "改善が必要"}
                  </p>
                )}
              </div>
              
              <div>
                <label className="text-sm font-medium block mb-2">
                  コメント（任意）
                </label>
                <Textarea
                  placeholder="この企業についての感想を教えてください..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="resize-none"
                  rows={3}
                />
              </div>

              <div>
                <p className="text-sm font-medium mb-3">評価の公開設定</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsAnonymous(false)}
                    className={`flex-1 p-3 rounded-lg border text-sm transition-all ${
                      isAnonymous === false
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <User className="w-4 h-4 mx-auto mb-1" />
                      <div className="font-medium">実名で投稿</div>
                      <div className="text-xs text-gray-500 mt-1">登録名が表示されます</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setIsAnonymous(true)}
                    className={`flex-1 p-3 rounded-lg border text-sm transition-all ${
                      isAnonymous === true
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <HelpCircle className="w-4 h-4 mx-auto mb-1" />
                      <div className="font-medium">匿名で投稿</div>
                      <div className="text-xs text-gray-500 mt-1">名前は表示されません</div>
                    </div>
                  </button>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    setShowForm(false)
                    setRating(0)
                    setComment('')
                    setSelectedRole(null)
                    setIsAnonymous(null)
                  }}
                  variant="outline"
                  className="flex-1"
                  disabled={submitting}
                >
                  キャンセル
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={submitting || rating === 0 || !selectedRole || isAnonymous === null}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {submitting ? '送信中...' : '評価を送信'}
                </Button>
              </div>
            </div>
          )
        ) : (
          <div className="text-center pt-4 border-t">
            <div className="mb-3">
              <User className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                評価するにはログインが必要です
              </p>
            </div>
            <Button variant="outline" className="w-full">
              ログイン
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}