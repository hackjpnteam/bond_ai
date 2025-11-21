'use client'

import { useState, useEffect } from 'react'
import { Rating } from '@/components/Rating'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { X, Star, Search, Building2, ChevronRight, ExternalLink, User, Briefcase, TrendingUp, Users, Heart, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

type UserRole = 'Founder' | 'Employee' | 'Investor' | 'Advisor' | 'Customer' | 'Fan'

interface Company {
  _id: string
  name: string
  slug?: string
  logoUrl?: string
  category?: string[]
  rating?: number
  totalRatings?: number
}

interface CompanyRatingFlowProps {
  isOpen: boolean
  onClose: () => void
}

export function CompanyRatingFlow({ isOpen, onClose }: CompanyRatingFlowProps) {
  const [step, setStep] = useState<'select' | 'rate'>('select')
  const [companies, setCompanies] = useState<Company[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchCompanies()
    }
  }, [isOpen])

  const fetchCompanies = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/companies')
      if (res.ok) {
        const data = await res.json()
        setCompanies(data)
      }
    } catch (error) {
      console.error('Failed to fetch companies:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelectCompany = (company: Company) => {
    setSelectedCompany(company)
    setStep('rate')
  }

  const handleSubmit = async () => {
    if (!selectedCompany || rating === 0) {
      toast.error('評価を選択してください')
      return
    }

    if (!selectedRole) {
      toast.error('あなたの立場を選択してください')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          companyId: selectedCompany._id, 
          rating, 
          comment,
          role: selectedRole
        })
      })

      if (res.ok) {
        toast.success(`${selectedCompany.name}の評価を送信しました！`)
        
        // 会社ページへのリンクを含む成功メッセージ
        if (selectedCompany.slug) {
          setTimeout(() => {
            const shouldNavigate = confirm(`${selectedCompany.name}のページを見ますか？`)
            if (shouldNavigate) {
              window.open(`/company/${selectedCompany.slug}`, '_blank')
            }
          }, 1000)
        }
        
        handleClose()
      } else {
        const data = await res.json()
        if (data.error === 'Unauthorized') {
          toast.error('評価するにはログインが必要です')
        } else {
          toast.error('評価の送信に失敗しました')
        }
      }
    } catch (error) {
      toast.error('エラーが発生しました')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setStep('select')
    setSelectedCompany(null)
    setRating(0)
    setComment('')
    setSelectedRole(null)
    setSearchQuery('')
    onClose()
  }

  const roleOptions = [
    { value: 'Founder' as UserRole, label: '創業者・経営者', icon: TrendingUp, color: 'from-green-400 to-green-600' },
    { value: 'Employee' as UserRole, label: '従業員', icon: Briefcase, color: 'from-blue-400 to-blue-600' },
    { value: 'Investor' as UserRole, label: '投資家', icon: TrendingUp, color: 'from-purple-400 to-purple-600' },
    { value: 'Advisor' as UserRole, label: 'アドバイザー', icon: HelpCircle, color: 'from-yellow-400 to-yellow-600' },
    { value: 'Customer' as UserRole, label: '顧客・ユーザー', icon: User, color: 'from-orange-400 to-orange-600' },
    { value: 'Fan' as UserRole, label: 'ファン・支援者', icon: Heart, color: 'from-bond-pink to-bond-pinkDark' },
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md" onClick={handleClose} />
      
      <div className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[95vh] shadow-2xl animate-fade-in-up border border-gray-200 flex flex-col">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 text-gray-500 hover:text-gray-800 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {step === 'select' ? (
          <div className="p-8 overflow-y-auto flex-1">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">
                評価する企業を選択
              </h2>
              <p className="text-gray-600 text-sm">
                評価したい企業を検索または選択してください
              </p>
            </div>

            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="企業名で検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {loading ? (
                <div className="text-center py-8 text-gray-500">
                  読み込み中...
                </div>
              ) : filteredCompanies.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchQuery ? '該当する企業が見つかりません' : '企業がありません'}
                </div>
              ) : (
                filteredCompanies.map((company) => (
                  <button
                    key={company._id}
                    onClick={() => handleSelectCompany(company)}
                    className="w-full p-4 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {company.logoUrl ? (
                          <img 
                            src={company.logoUrl} 
                            alt={company.name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-gray-500" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{company.name}</p>
                          {company.rating && (
                            <div className="flex items-center gap-1 mt-1">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs text-gray-600">
                                {company.rating.toFixed(1)} ({company.totalRatings || 0}件)
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* デモ用企業の追加 */}
            {filteredCompanies.length === 0 && !loading && (
              <div className="mt-4">
                <p className="text-sm text-gray-500 text-center mb-3">デモ用企業：</p>
                <div className="space-y-2">
                  {[
                    { _id: 'demo1', name: 'TechStart Inc.', slug: 'techstart-inc', rating: 4.2, totalRatings: 45 },
                    { _id: 'demo2', name: 'Innovation Labs', slug: 'innovation-labs', rating: 4.8, totalRatings: 128 },
                    { _id: 'demo3', name: 'Future Connect', slug: 'future-connect', rating: 3.9, totalRatings: 67 },
                  ].map((company) => (
                    <button
                      key={company._id}
                      onClick={() => handleSelectCompany(company as Company)}
                      className="w-full p-4 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-left group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{company.name}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs text-gray-600">
                                {company.rating.toFixed(1)} ({company.totalRatings}件)
                              </span>
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 overflow-y-auto flex-1 flex flex-col">
            <button
              onClick={() => setStep('select')}
              className="mb-4 text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              企業選択に戻る
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">
                {selectedCompany?.name}を評価
              </h2>
              <p className="text-gray-600 text-sm">
                あなたの評価が他のユーザーの参考になります
              </p>
            </div>

            <div className="space-y-6 flex-1">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">あなたの立場を選択</p>
                <div className="grid grid-cols-2 gap-3">
                  {roleOptions.map((role) => {
                    const IconComponent = role.icon
                    return (
                      <button
                        key={role.value}
                        onClick={() => setSelectedRole(role.value)}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                          selectedRole === role.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${role.color} flex items-center justify-center`}>
                            <IconComponent className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-sm font-medium">{role.label}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

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
              
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  コメント（任意）
                </label>
                <Textarea
                  placeholder="この企業についての感想を教えてください..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="resize-none bg-gray-50 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 w-full"
                  rows={3}
                />
              </div>
            </div>
            
            {/* ボタンを固定位置に配置 */}
            <div className="border-t pt-4 mt-6">
              <div className="flex gap-3">
                <Button 
                  onClick={() => setStep('select')}
                  variant="outline"
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                  disabled={submitting}
                >
                  戻る
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={submitting || rating === 0 || !selectedRole}
                  className="flex-1 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {submitting ? '送信中...' : '評価を送信'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}