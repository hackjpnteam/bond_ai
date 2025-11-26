'use client'

import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Star, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { getRelationshipLabel } from '@/lib/relationship'

interface Evaluation {
  id: string
  companyName: string
  companySlug: string
  rating: number
  relationshipType: number
  relationshipLabel?: string
  comment?: string
  categories?: {
    culture: number
    growth: number
    workLifeBalance: number
    compensation: number
    leadership: number
  }
  createdAt?: string
  updatedAt?: string
}

interface EditEvaluationModalProps {
  evaluation: Evaluation | null
  isOpen: boolean
  onClose: () => void
  onSave: (updatedEvaluation: Evaluation) => void
}

const RELATIONSHIP_OPTIONS = [
  { value: 0, label: '未設定' },
  { value: 1, label: '知人' },
  { value: 2, label: '取引先' },
  { value: 3, label: '協業先' },
  { value: 4, label: '投資先' },
  { value: 5, label: '株主' },
  { value: 6, label: '友達' },
]

const CATEGORY_LABELS = {
  culture: '企業文化',
  growth: '成長性',
  workLifeBalance: 'ワークライフバランス',
  compensation: '報酬',
  leadership: 'リーダーシップ',
}

export default function EditEvaluationModal({
  evaluation,
  isOpen,
  onClose,
  onSave,
}: EditEvaluationModalProps) {
  const [rating, setRating] = useState(evaluation?.rating || 3)
  const [comment, setComment] = useState(evaluation?.comment || '')
  const [relationshipType, setRelationshipType] = useState(evaluation?.relationshipType || 0)
  const [categories, setCategories] = useState(evaluation?.categories || {
    culture: 3,
    growth: 3,
    workLifeBalance: 3,
    compensation: 3,
    leadership: 3,
  })
  const [saving, setSaving] = useState(false)
  const [editReason, setEditReason] = useState('')

  // Reset form when evaluation changes
  const resetForm = () => {
    if (evaluation) {
      setRating(evaluation.rating)
      setComment(evaluation.comment || '')
      setRelationshipType(evaluation.relationshipType)
      setCategories(evaluation.categories || {
        culture: 3,
        growth: 3,
        workLifeBalance: 3,
        compensation: 3,
        leadership: 3,
      })
      setEditReason('')
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (open) {
      resetForm()
    } else {
      onClose()
    }
  }

  const handleSave = async () => {
    if (!evaluation) return

    setSaving(true)
    try {
      const response = await fetch(`/api/evaluations/${evaluation.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          rating,
          comment,
          relationshipType,
          categories,
          reason: editReason,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '評価の更新に失敗しました')
      }

      const data = await response.json()
      toast.success('評価を更新しました')

      onSave({
        ...evaluation,
        rating,
        comment,
        relationshipType,
        relationshipLabel: getRelationshipLabel(relationshipType),
        categories,
        updatedAt: new Date().toISOString(),
      })
      onClose()
    } catch (error: any) {
      console.error('Error updating evaluation:', error)
      toast.error(error.message || '評価の更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const renderStars = (value: number, onChange: (v: number) => void, size: 'sm' | 'lg' = 'lg') => {
    const starSize = size === 'lg' ? 'w-8 h-8' : 'w-5 h-5'
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Star
              className={`${starSize} ${
                star <= value
                  ? 'text-yellow-500 fill-yellow-500'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    )
  }

  if (!evaluation) return null

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>評価を編集</SheetTitle>
          <SheetDescription>
            {evaluation.companyName}の評価を編集します
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* Overall Rating */}
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-2 block">
              総合評価
            </Label>
            <div className="flex items-center gap-3">
              {renderStars(rating, setRating)}
              <span className="text-lg font-bold text-gray-900">{rating.toFixed(1)}</span>
            </div>
          </div>

          {/* Relationship Type */}
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-2 block">
              関係性
            </Label>
            <div className="flex flex-wrap gap-2">
              {RELATIONSHIP_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRelationshipType(option.value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    relationshipType === option.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category Ratings */}
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-3 block">
              カテゴリー別評価
            </Label>
            <div className="space-y-3">
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{label}</span>
                  {renderStars(
                    categories[key as keyof typeof categories],
                    (v) => setCategories({ ...categories, [key]: v }),
                    'sm'
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-2 block">
              コメント
            </Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="この企業についてのコメントを入力..."
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Edit Reason (optional) */}
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-2 block">
              編集理由 <span className="text-gray-400 font-normal">(任意)</span>
            </Label>
            <Textarea
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              placeholder="編集した理由があれば入力してください..."
              rows={2}
              className="resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              編集履歴に記録されます
            </p>
          </div>
        </div>

        <SheetFooter className="flex gap-3">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            キャンセル
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              '保存する'
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
