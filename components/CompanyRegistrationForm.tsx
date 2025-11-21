'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, Globe, MapPin, Users, Calendar, DollarSign, Target, Eye, Heart, Upload } from 'lucide-react'

interface CompanyFormData {
  name: string
  slug: string
  description: string
  website: string
  industry: string
  foundedYear: number
  location: string
  employees: number
  funding: string
  mission: string
  vision: string
  values: string[]
  logoFile: File | null
}

export function CompanyRegistrationForm() {
  const [formData, setFormData] = useState<CompanyFormData>({
    name: '',
    slug: '',
    description: '',
    website: '',
    industry: '',
    foundedYear: new Date().getFullYear(),
    location: '',
    employees: 1,
    funding: '',
    mission: '',
    vision: '',
    values: [],
    logoFile: null
  })

  const [currentValue, setCurrentValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const industries = [
    'AI・機械学習', 'コンサルティング', 'プラットフォーム', 'FinTech', 
    'ヘルステック', 'EdTech', 'エネルギー', 'Eコマース', 'SaaS', 
    'ゲーム', 'メディア', 'ハードウェア', 'モビリティ', 'その他'
  ]

  const handleInputChange = (field: keyof CompanyFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // 会社名からスラッグを自動生成
    if (field === 'name') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 50)
      setFormData(prev => ({ ...prev, slug }))
    }
    
    // エラーをクリア
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const addValue = () => {
    if (currentValue.trim() && !formData.values.includes(currentValue.trim())) {
      setFormData(prev => ({
        ...prev,
        values: [...prev.values, currentValue.trim()]
      }))
      setCurrentValue('')
    }
  }

  const removeValue = (valueToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      values: prev.values.filter(v => v !== valueToRemove)
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // ファイルサイズチェック (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, logoFile: 'ファイルサイズは5MB以下にしてください' }))
        return
      }
      
      // ファイル形式チェック
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, logoFile: '画像ファイルを選択してください' }))
        return
      }
      
      setFormData(prev => ({ ...prev, logoFile: file }))
      setErrors(prev => ({ ...prev, logoFile: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = '会社名は必須です'
    if (!formData.description.trim()) newErrors.description = '事業内容は必須です'
    if (!formData.industry) newErrors.industry = '業界を選択してください'
    if (!formData.location.trim()) newErrors.location = '所在地は必須です'
    if (formData.employees < 1) newErrors.employees = '従業員数は1人以上にしてください'
    
    if (formData.website && !formData.website.startsWith('http')) {
      newErrors.website = 'URLは http:// または https:// から始めてください'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsSubmitting(true)
    
    try {
      // TODO: API呼び出し実装
      console.log('Company registration data:', formData)
      
      // 仮の成功処理
      alert('会社登録が完了しました！審査後に公開されます。')
      
      // フォームリセット
      setFormData({
        name: '',
        slug: '',
        description: '',
        website: '',
        industry: '',
        foundedYear: new Date().getFullYear(),
        location: '',
        employees: 1,
        funding: '',
        mission: '',
        vision: '',
        values: [],
        logoFile: null
      })
      
    } catch (error) {
      console.error('Registration error:', error)
      alert('登録に失敗しました。もう一度お試しください。')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
      {/* 基本情報 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            基本情報
          </CardTitle>
          <CardDescription>
            会社の基本的な情報を入力してください
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-ash-text mb-2">
                会社名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-2 border border-ash-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm bg-white/80"
                placeholder="株式会社○○"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-ash-text mb-2">
                スラッグ（URL用）
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => handleInputChange('slug', e.target.value)}
                className="w-full px-4 py-2 border border-ash-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm bg-white/80"
                placeholder="company-name"
              />
              <p className="text-sm text-ash-muted mt-1">
                URL: /company/{formData.slug || 'company-name'}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ash-text mb-2">
              事業内容 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full px-4 py-2 border border-ash-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm bg-white/80"
              rows={4}
              placeholder="会社の事業内容や特徴について詳しく説明してください"
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-ash-text mb-2">
                ウェブサイト
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                className="w-full px-4 py-2 border border-ash-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm bg-white/80"
                placeholder="https://example.com"
              />
              {errors.website && <p className="text-red-500 text-sm mt-1">{errors.website}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-ash-text mb-2">
                業界 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.industry}
                onChange={(e) => handleInputChange('industry', e.target.value)}
                className="w-full px-4 py-2 border border-ash-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm bg-white/80"
              >
                <option value="">業界を選択</option>
                {industries.map(industry => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
              {errors.industry && <p className="text-red-500 text-sm mt-1">{errors.industry}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 詳細情報 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            詳細情報
          </CardTitle>
          <CardDescription>
            会社の詳細な情報を入力してください
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-ash-text mb-2">
                設立年
              </label>
              <input
                type="number"
                value={formData.foundedYear}
                onChange={(e) => handleInputChange('foundedYear', parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-ash-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm bg-white/80"
                min="1900"
                max={new Date().getFullYear()}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ash-text mb-2">
                所在地 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="w-full px-4 py-2 border border-ash-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm bg-white/80"
                placeholder="東京都渋谷区"
              />
              {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-ash-text mb-2">
                従業員数 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.employees}
                onChange={(e) => handleInputChange('employees', parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-ash-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm bg-white/80"
                min="1"
              />
              {errors.employees && <p className="text-red-500 text-sm mt-1">{errors.employees}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ash-text mb-2">
              調達額（任意）
            </label>
            <input
              type="text"
              value={formData.funding}
              onChange={(e) => handleInputChange('funding', e.target.value)}
              className="w-full px-4 py-2 border border-ash-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm bg-white/80"
              placeholder="5億円"
            />
          </div>
        </CardContent>
      </Card>

      {/* 企業理念 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            企業理念・ビジョン
          </CardTitle>
          <CardDescription>
            会社の理念やビジョンを入力してください（任意）
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-ash-text mb-2">
              <Target className="w-4 h-4 inline mr-1" />
              ミッション
            </label>
            <textarea
              value={formData.mission}
              onChange={(e) => handleInputChange('mission', e.target.value)}
              className="w-full px-4 py-2 border border-ash-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm bg-white/80"
              rows={3}
              placeholder="会社の使命や存在意義について"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ash-text mb-2">
              <Eye className="w-4 h-4 inline mr-1" />
              ビジョン
            </label>
            <textarea
              value={formData.vision}
              onChange={(e) => handleInputChange('vision', e.target.value)}
              className="w-full px-4 py-2 border border-ash-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm bg-white/80"
              rows={3}
              placeholder="将来の目標や理想の姿について"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ash-text mb-2">
              <Heart className="w-4 h-4 inline mr-1" />
              バリュー（価値観）
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addValue())}
                className="flex-1 px-4 py-2 border border-ash-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm bg-white/80"
                placeholder="価値観を入力してEnterで追加"
              />
              <button
                type="button"
                onClick={addValue}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                追加
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.values.map((value, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="cursor-pointer hover:bg-red-100"
                  onClick={() => removeValue(value)}
                >
                  {value} ×
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ロゴアップロード */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            ロゴ画像（任意）
          </CardTitle>
          <CardDescription>
            会社のロゴをアップロードしてください（5MB以下）
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-ash-line rounded-lg p-6 text-center">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="logo-upload"
            />
            <label htmlFor="logo-upload" className="cursor-pointer">
              <Upload className="w-12 h-12 text-ash-muted mx-auto mb-4" />
              <p className="text-ash-text">クリックしてロゴをアップロード</p>
              <p className="text-sm text-ash-muted mt-1">PNG, JPG, SVG (最大5MB)</p>
            </label>
            {formData.logoFile && (
              <p className="text-green-600 mt-2">
                選択済み: {formData.logoFile.name}
              </p>
            )}
            {errors.logoFile && <p className="text-red-500 text-sm mt-1">{errors.logoFile}</p>}
          </div>
        </CardContent>
      </Card>

      {/* 送信ボタン */}
      <div className="flex justify-center">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`px-8 py-3 rounded-lg font-semibold transition-all duration-200 ${
            isSubmitting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 transform hover:scale-105'
          } text-white backdrop-blur-xl`}
        >
          {isSubmitting ? '登録中...' : '会社を登録する'}
        </button>
      </div>
    </form>
  )
}