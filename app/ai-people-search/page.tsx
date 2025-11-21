'use client'

import { useState } from 'react'
import { Search, Loader2, ArrowLeft, Brain, Users, Sparkles, Filter, Target, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import ProfileCard from '@/components/ProfileCard'
import { toast } from 'sonner'
import Link from 'next/link'

interface BondProfile {
  id: string
  name: string
  title: string
  company: string
  summary: string
  link?: string
  commonPoint: string
  source: 'Bond Network'
  trustScore: number
  review?: {
    by: string
    comment: string
    rating: number
  }
  connectionPath?: string[]
  relevanceScore?: number
}

interface PublicProfile {
  name: string
  title: string
  company: string
  summary: string
  link: string
  commonPoint: string
  source: 'Public Network'
  platform: 'LinkedIn' | 'Wantedly' | 'X' | 'GitHub' | 'Other'
  confidence: number
  relevanceScore?: number
}

type Profile = BondProfile | PublicProfile

interface SearchAnalysis {
  totalProfiles: number
  bondNetworkCount: number
  publicNetworkCount: number
  avgTrustScore: number
  searchStrategy: 'hybrid' | 'ai_only'
}

export default function AIPeopleSearchPage() {
  const [company, setCompany] = useState('')
  const [userInterests, setUserInterests] = useState<string[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [analysis, setAnalysis] = useState<SearchAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [message, setMessage] = useState('')

  const popularInterests = [
    'AI・機械学習', 'プロダクト管理', 'スタートアップ', 'データサイエンス',
    'エンジニアリング', 'マーケティング', 'セールス', '投資・VC',
    'デザイン・UX', 'ビジネス戦略', 'Web3・ブロックチェーン', 'SaaS'
  ]

  const popularCompanies = [
    'chatwork', '株式会社Sopital', 'hackjpn', '株式会社HOKUTO', 'ホーミー'
  ]

  const toggleInterest = (interest: string) => {
    setUserInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    )
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!company.trim()) return

    setLoading(true)
    setHasSearched(true)

    try {
      const response = await fetch('/api/ai-people-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company: company.trim(),
          userInterests,
          userQuery: company.trim()
        }),
      })

      if (!response.ok) {
        throw new Error('Search failed')
      }

      const data = await response.json()
      setProfiles(data.profiles || [])
      setAnalysis(data.analysis || null)
      setMessage(data.message || '')
      
    } catch (error) {
      console.error('Error searching people:', error)
      toast.error('検索中にエラーが発生しました')
      setProfiles([])
      setAnalysis(null)
    } finally {
      setLoading(false)
    }
  }

  const handleRequestIntroduction = (profile: Profile) => {
    toast.success(`${profile.name}さんへの紹介依頼を送信しました`)
    // In production, this would open an introduction request modal
  }

  const handleConnect = (profile: Profile) => {
    toast.success(`${profile.name}さんへの接触を試みます`)
    // In production, this would handle public network outreach
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
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-serif font-bold text-gray-900">
              AI人物探索
            </h1>
            <Badge className="bg-gradient-to-r from-purple-500 to-blue-600 text-white">
              Bond優先表示モード
            </Badge>
          </div>
          <p className="text-gray-600">
            Bondネットワーク内の信頼済み人脈 + AI探索による候補者発見
          </p>
        </div>
      </div>

      <div className="container-narrow mx-auto px-4 py-8">
        {/* Search Section */}
        <div className="card p-8 mb-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Brain className="w-8 h-8 text-purple-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              どちらの企業の人とつながりたいですか？
            </h2>
            <p className="text-gray-600">
              まずBondネットワーク内を検索し、足りない部分をAIが補完します
            </p>
          </div>

          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-6">
            <div className="flex gap-3 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="企業名を入力してください（例: Google, Microsoft...）"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <Button
                type="submit"
                disabled={loading || !company.trim()}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    AI探索中...
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4" />
                    人物探索
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Interest Selection */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-gray-600" />
              <label className="text-sm font-medium text-gray-700">
                あなたの興味分野（複数選択可）
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              {popularInterests.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    userInterests.includes(interest)
                      ? 'bg-purple-100 text-purple-800 border border-purple-300'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          {/* Popular Companies */}
          <div>
            <p className="text-sm text-gray-600 mb-3">人気の企業:</p>
            <div className="flex flex-wrap gap-2">
              {popularCompanies.map((companyName) => (
                <button
                  key={companyName}
                  onClick={() => setCompany(companyName)}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                >
                  {companyName}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-flex flex-col items-center gap-4 text-purple-600">
              <div className="relative">
                <Loader2 className="w-8 h-8 animate-spin" />
                <Brain className="w-4 h-4 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div className="text-center">
                <p className="text-lg font-medium">AI人物探索を実行中...</p>
                <p className="text-sm text-gray-600 mt-1">
                  Bond内検索 → AI候補生成 → 関連度分析
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        {hasSearched && !loading && (
          <>
            {/* Analysis Summary */}
            {analysis && (
              <div className="card p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800">探索結果サマリー</h3>
                  <Badge className={
                    analysis.searchStrategy === 'hybrid' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }>
                    {analysis.searchStrategy === 'hybrid' ? 'ハイブリッド探索' : 'AI単独探索'}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{analysis.bondNetworkCount}</div>
                    <div className="text-sm text-gray-600">Bondネットワーク</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{analysis.publicNetworkCount}</div>
                    <div className="text-sm text-gray-600">AI探索候補</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{analysis.totalProfiles}</div>
                    <div className="text-sm text-gray-600">総候補者数</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {analysis.avgTrustScore > 0 ? analysis.avgTrustScore.toFixed(1) : 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">平均信頼スコア</div>
                  </div>
                </div>

                {message && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700">{message}</p>
                  </div>
                )}
              </div>
            )}

            {/* Profiles Grid */}
            {profiles.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-800">
                    候補者一覧 ({profiles.length}人)
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <TrendingUp className="w-4 h-4" />
                    関連度順に表示
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {profiles.map((profile, index) => (
                    <ProfileCard
                      key={profile.source === 'Bond Network' ? (profile as BondProfile).id : `${profile.name}-${index}`}
                      profile={profile}
                      onRequestIntroduction={handleRequestIntroduction}
                      onConnect={handleConnect}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 card">
                <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  候補者が見つかりませんでした
                </h3>
                <p className="text-gray-600 mb-4">
                  別の企業名で検索してみてください
                </p>
              </div>
            )}
          </>
        )}

        {/* Feature Explanation */}
        {!hasSearched && (
          <div className="mt-12">
            <h3 className="text-xl font-bold text-center text-gray-800 mb-8">
              AI人物探索の特徴
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-bold mb-2">🟢 Bond優先表示</h4>
                <p className="text-sm text-gray-600">
                  信頼済みのBondネットワーク内の人物を最優先で表示し、確実性の高い紹介を実現
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-bold mb-2">🔵 AI補完機能</h4>
                <p className="text-sm text-gray-600">
                  Bond内で見つからない場合、AIが公開情報から適切な候補者を探索・提案
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="font-bold mb-2">⚡ インテリジェント分析</h4>
                <p className="text-sm text-gray-600">
                  あなたの興味分野と候補者の専門性を分析し、最適なマッチングを提案
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}