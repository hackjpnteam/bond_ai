'use client'

import { useState, useEffect } from 'react'
import { Search, Loader2, ArrowLeft, Sparkles, Target, Network, Building2, ChevronRight, Star } from 'lucide-react'
import { ReferralRouteVisualization } from '@/components/ReferralRouteVisualization'
import Link from 'next/link'
import { LockedFeature } from '@/components/OnboardingBanner'

interface Connection {
  id: string
  name: string
  company: string
  trustScore: number
  connectionStrength: number
  industry: string
  position: string
}

interface ReferralRoute {
  path: Connection[]
  totalTrustScore: number
  efficiency: number
  successProbability: number
  estimatedDays: number
}

interface RouteAnalysis {
  totalRoutes: number
  bestRoute: ReferralRoute | null
  averageSuccessRate: number
}

interface Industry {
  name: string
  count: number
}

interface CompanyResult {
  id: string
  name: string
  slug: string
  industry: string
  description: string
  averageRating: number
}

type SearchMode = 'company' | 'industry'

export default function ReferralRoutesPage() {
  const [targetCompany, setTargetCompany] = useState('')
  const [routes, setRoutes] = useState<ReferralRoute[]>([])
  const [analysis, setAnalysis] = useState<RouteAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  // 業界検索用state
  const [searchMode, setSearchMode] = useState<SearchMode>('company')
  const [industryQuery, setIndustryQuery] = useState('')
  const [industries, setIndustries] = useState<Industry[]>([])
  const [industryCompanies, setIndustryCompanies] = useState<CompanyResult[]>([])
  const [selectedIndustry, setSelectedIndustry] = useState('')
  const [loadingIndustries, setLoadingIndustries] = useState(false)
  const [loadingCompanies, setLoadingCompanies] = useState(false)

  // 業界一覧を取得
  useEffect(() => {
    const fetchIndustries = async () => {
      setLoadingIndustries(true)
      try {
        const res = await fetch('/api/referral-routes')
        const data = await res.json()
        setIndustries(data.industries || [])
      } catch (error) {
        console.error('Error fetching industries:', error)
      } finally {
        setLoadingIndustries(false)
      }
    }
    fetchIndustries()
  }, [])

  // 業界から会社を検索
  const handleIndustrySearch = async (industry: string) => {
    setSelectedIndustry(industry)
    setLoadingCompanies(true)
    setIndustryCompanies([])

    try {
      const res = await fetch(`/api/referral-routes?industry=${encodeURIComponent(industry)}`)
      const data = await res.json()
      setIndustryCompanies(data.companies || [])
    } catch (error) {
      console.error('Error searching companies by industry:', error)
    } finally {
      setLoadingCompanies(false)
    }
  }

  // 会社を選択してルート検索
  const handleSelectCompany = (companyName: string) => {
    setTargetCompany(companyName)
    setSearchMode('company')
    // 自動で検索実行
    handleSearchWithCompany(companyName)
  }

  const handleSearchWithCompany = async (company: string) => {
    if (!company.trim()) return

    setLoading(true)
    setHasSearched(true)

    try {
      const response = await fetch('/api/referral-routes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetCompany: company }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch referral routes')
      }

      const data = await response.json()
      setRoutes(data.routes)
      setAnalysis(data.analysis)
    } catch (error) {
      console.error('Error fetching referral routes:', error)
      setRoutes([])
      setAnalysis(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    handleSearchWithCompany(targetCompany)
  }

  const popularCompanies = [
    'chatwork', '株式会社Sopital', 'hackjpn', '株式会社HOKUTO'
  ]

  const popularIndustries = [
    'IT', 'テクノロジー', 'ヘルスケア', '金融', 'メディア'
  ]

  // 業界をフィルタリング
  const filteredIndustries = industryQuery
    ? industries.filter(i => i.name?.toLowerCase().includes(industryQuery.toLowerCase()))
    : industries

  return (
    <LockedFeature featureName="AI最適ルート提案">
      <div className="min-h-screen bg-gradient-to-b from-white to-ash-surface/30">
        {/* Header */}
        <div className="bg-white border-b border-ash-line">
          <div className="container-narrow mx-auto px-3 md:px-4 py-4 md:py-6">
            <Link href="/" className="inline-flex items-center gap-2 text-xs md:text-sm text-gray-600 hover:text-gray-900 mb-3 md:mb-4 py-1">
              <ArrowLeft className="w-4 h-4" />
              ホームに戻る
            </Link>
            <div className="flex items-center gap-2 md:gap-3 mb-2">
              <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Network className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-gray-900">
                AI最適ルート提案
              </h1>
            </div>
            <p className="text-sm md:text-base text-gray-600">
              AIが信頼関係を分析し、目標企業への最適な紹介ルートを提案します
            </p>
          </div>
        </div>

        <div className="container-narrow mx-auto px-3 md:px-4 py-6 md:py-8">
          {/* Search Section */}
          <div className="card p-4 sm:p-6 md:p-8 mb-6 md:mb-8">
            <div className="text-center mb-4 md:mb-6">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
              </div>
              <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-1 md:mb-2">
                どちらの企業とつながりたいですか？
              </h2>
              <p className="text-sm md:text-base text-gray-600">
                企業名または業界から検索できます
              </p>
            </div>

            {/* 検索モード切り替え */}
            <div className="flex justify-center gap-2 mb-4 md:mb-6">
              <button
                onClick={() => setSearchMode('company')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  searchMode === 'company'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Building2 className="w-4 h-4 inline mr-1" />
                企業名で検索
              </button>
              <button
                onClick={() => setSearchMode('industry')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  searchMode === 'industry'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Network className="w-4 h-4 inline mr-1" />
                業界で検索
              </button>
            </div>

            {/* 企業名検索モード */}
            {searchMode === 'company' && (
              <>
                <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                      <input
                        type="text"
                        value={targetCompany}
                        onChange={(e) => setTargetCompany(e.target.value)}
                        placeholder="企業名を入力（例: Google...）"
                        className="w-full pl-9 md:pl-10 pr-4 py-3 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading || !targetCompany.trim()}
                      className="btn-dark px-4 md:px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm md:text-base w-full sm:w-auto"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>分析中...</span>
                        </>
                      ) : (
                        <>
                          <Target className="w-4 h-4" />
                          <span>ルート分析</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Popular Companies */}
                <div className="mt-4 md:mt-6">
                  <p className="text-xs md:text-sm text-gray-600 mb-2 md:mb-3 text-center">人気の企業:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {popularCompanies.map((company) => (
                      <button
                        key={company}
                        onClick={() => setTargetCompany(company)}
                        className="px-3 py-1.5 text-xs md:text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                      >
                        {company}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* 業界検索モード */}
            {searchMode === 'industry' && (
              <div className="max-w-3xl mx-auto">
                {!selectedIndustry ? (
                  <>
                    {/* 業界検索 */}
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                      <input
                        type="text"
                        value={industryQuery}
                        onChange={(e) => setIndustryQuery(e.target.value)}
                        placeholder="業界名で絞り込み..."
                        className="w-full pl-9 md:pl-10 pr-4 py-3 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* 人気の業界 */}
                    <div className="mb-4">
                      <p className="text-xs md:text-sm text-gray-600 mb-2 text-center">人気の業界:</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {popularIndustries.map((ind) => (
                          <button
                            key={ind}
                            onClick={() => handleIndustrySearch(ind)}
                            className="px-3 py-1.5 text-xs md:text-sm bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-full transition-colors"
                          >
                            {ind}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 業界一覧 */}
                    {loadingIndustries ? (
                      <div className="text-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
                        <p className="text-sm text-gray-500 mt-2">業界一覧を読み込み中...</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {filteredIndustries.map((industry) => (
                          <button
                            key={industry.name}
                            onClick={() => handleIndustrySearch(industry.name)}
                            className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
                          >
                            <span className="text-sm font-medium text-gray-800 truncate">{industry.name}</span>
                            <span className="text-xs text-gray-500 ml-2">{industry.count}社</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* 選択した業界の会社一覧 */}
                    <div className="mb-4">
                      <button
                        onClick={() => {
                          setSelectedIndustry('')
                          setIndustryCompanies([])
                        }}
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mb-3"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        業界一覧に戻る
                      </button>
                      <h3 className="text-lg font-bold text-gray-800">
                        {selectedIndustry}の企業一覧
                      </h3>
                      <p className="text-sm text-gray-600">企業を選択するとルート検索を開始します</p>
                    </div>

                    {loadingCompanies ? (
                      <div className="text-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
                        <p className="text-sm text-gray-500 mt-2">企業を検索中...</p>
                      </div>
                    ) : industryCompanies.length === 0 ? (
                      <div className="text-center py-8">
                        <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500">この業界の企業が見つかりませんでした</p>
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {industryCompanies.map((company) => (
                          <button
                            key={company.id}
                            onClick={() => handleSelectCompany(company.name)}
                            className="flex items-center justify-between p-4 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg transition-all text-left"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">{company.name}</span>
                                {company.averageRating > 0 && (
                                  <span className="flex items-center gap-0.5 text-yellow-500 text-sm">
                                    <Star className="w-3 h-3 fill-current" />
                                    {company.averageRating.toFixed(1)}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 mt-1 line-clamp-1">{company.description}</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8 md:py-12">
              <div className="inline-flex items-center gap-2 md:gap-3 text-blue-600">
                <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" />
                <span className="text-base md:text-lg font-medium">AIが最適ルートを分析中...</span>
              </div>
              <p className="text-sm md:text-base text-gray-600 mt-2">
                信頼関係とネットワークデータを解析しています
              </p>
            </div>
          )}

          {/* Results Section */}
          {hasSearched && !loading && (
            <>
              {analysis && analysis.totalRoutes > 0 && (
                <div className="card p-4 md:p-6 mb-4 md:mb-6">
                  <h3 className="text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4">分析結果サマリー</h3>
                  <div className="grid grid-cols-3 gap-2 md:gap-4">
                    <div className="text-center p-3 md:p-4 bg-blue-50 rounded-lg">
                      <div className="text-xl md:text-2xl font-bold text-blue-600">{analysis.totalRoutes}</div>
                      <div className="text-xs md:text-sm text-gray-600">発見ルート数</div>
                    </div>
                    <div className="text-center p-3 md:p-4 bg-green-50 rounded-lg">
                      <div className="text-xl md:text-2xl font-bold text-green-600">
                        {Math.round(analysis.averageSuccessRate * 100)}%
                      </div>
                      <div className="text-xs md:text-sm text-gray-600">平均成功率</div>
                    </div>
                    <div className="text-center p-3 md:p-4 bg-purple-50 rounded-lg">
                      <div className="text-xl md:text-2xl font-bold text-purple-600">
                        {analysis.bestRoute ? `${analysis.bestRoute.estimatedDays}日` : 'N/A'}
                      </div>
                      <div className="text-xs md:text-sm text-gray-600">最短期間</div>
                    </div>
                  </div>
                </div>
              )}

              <ReferralRouteVisualization routes={routes} targetCompany={targetCompany} />
            </>
          )}

          {/* Feature Explanation */}
          {!hasSearched && (
            <div className="mt-8 md:mt-12">
              <h3 className="text-lg md:text-xl font-bold text-center text-gray-800 mb-6 md:mb-8">
                AI最適ルート提案の特徴
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                <div className="text-center p-4 md:p-0">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3 md:mb-4">
                    <Network className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                  </div>
                  <h4 className="font-bold mb-1 md:mb-2 text-sm md:text-base">信頼関係分析</h4>
                  <p className="text-xs md:text-sm text-gray-600">
                    過去の取引実績や評価データから信頼度を数値化し、最も信頼できるルートを提案
                  </p>
                </div>
                <div className="text-center p-4 md:p-0">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3 md:mb-4">
                    <Target className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
                  </div>
                  <h4 className="font-bold mb-1 md:mb-2 text-sm md:text-base">成功確率予測</h4>
                  <p className="text-xs md:text-sm text-gray-600">
                    AIが過去のマッチング成功例を学習し、各ルートの成功確率を予測
                  </p>
                </div>
                <div className="text-center p-4 md:p-0">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3 md:mb-4">
                    <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
                  </div>
                  <h4 className="font-bold mb-1 md:mb-2 text-sm md:text-base">リアルタイム最適化</h4>
                  <p className="text-xs md:text-sm text-gray-600">
                    ネットワークの変化をリアルタイムで反映し、常に最新の最適ルートを提案
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </LockedFeature>
  )
}