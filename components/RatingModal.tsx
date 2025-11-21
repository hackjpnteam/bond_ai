'use client'

import { useState } from 'react'
import { Rating } from '@/components/Rating'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { X, Star } from 'lucide-react'
import { toast } from 'sonner'

interface RatingModalProps {
  isOpen: boolean
  onClose: () => void
  companyName?: string
}

export function RatingModal({ isOpen, onClose, companyName = "Bond" }: RatingModalProps) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('評価を選択してください')
      return
    }

    setSubmitting(true)
    
    // デモ用のシミュレーション
    setTimeout(() => {
      toast.success('評価を送信しました！ありがとうございます。')
      setRating(0)
      setComment('')
      setSubmitting(false)
      onClose()
    }, 1000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl animate-fade-in-up border border-gray-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">
            {companyName}を評価
          </h2>
          <p className="text-gray-600 text-sm">
            あなたの評価が他のユーザーの参考になります
          </p>
        </div>
        
        <div className="space-y-6">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">評価を選択</p>
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
            <label className="text-sm font-medium text-gray-700 block mb-2">
              コメント（任意）
            </label>
            <Textarea
              placeholder="この企業についての感想を教えてください..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="resize-none bg-gray-50 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              rows={4}
            />
          </div>
          
          <div className="flex gap-3">
            <Button 
              onClick={onClose}
              variant="outline"
              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
              disabled={submitting}
            >
              キャンセル
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={submitting || rating === 0}
              className="flex-1 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {submitting ? '送信中...' : '評価を送信'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
