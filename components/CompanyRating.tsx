'use client'

import { useState } from 'react'
import { Rating } from '@/components/Rating'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'

interface CompanyRatingProps {
  companyId: string
  initialRating?: number
  totalRatings?: number
}

export function CompanyRating({ companyId, initialRating = 0, totalRatings = 0 }: CompanyRatingProps) {
  const { data: session } = useSession()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [currentRating, setCurrentRating] = useState(initialRating)
  const [currentTotal, setCurrentTotal] = useState(totalRatings)

  const handleSubmit = async () => {
    if (!session) {
      toast.error('ログインしてください')
      return
    }

    if (rating === 0) {
      toast.error('評価を選択してください')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, rating, comment })
      })

      const data = await res.json()
      
      if (res.ok) {
        toast.success('評価を投稿しました')
        setCurrentRating(data.rating)
        setCurrentTotal(data.totalRatings)
        setRating(0)
        setComment('')
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
        <CardTitle>企業評価</CardTitle>
        <CardDescription>
          この企業を評価してください
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-2">総合評価</p>
          <Rating 
            value={currentRating} 
            readonly 
            size="lg"
            showValue
            totalRatings={currentTotal}
          />
        </div>
        
        {session ? (
          <div className="space-y-3 pt-4 border-t">
            <p className="text-sm font-medium">あなたの評価</p>
            <Rating 
              value={rating} 
              onChange={setRating}
              size="lg"
            />
            <Textarea
              placeholder="コメント（任意）"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="resize-none"
              rows={3}
            />
            <Button 
              onClick={handleSubmit} 
              disabled={submitting || rating === 0}
              className="w-full"
            >
              {submitting ? '送信中...' : '評価を送信'}
            </Button>
          </div>
        ) : (
          <div className="pt-4 border-t text-center">
            <p className="text-sm text-muted-foreground">
              評価するにはログインが必要です
            </p>
            <Button variant="outline" className="mt-2">
              ログイン
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}