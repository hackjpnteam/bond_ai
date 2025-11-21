'use client'

import { useState } from 'react'
import { Search, Loader2, ArrowLeft, Sparkles, Target, Network } from 'lucide-react'
import { ReferralRouteVisualization } from '@/components/ReferralRouteVisualization'
import Link from 'next/link'

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

export default function ReferralRoutesPage() {
  const [targetCompany, setTargetCompany] = useState('')
  const [routes, setRoutes] = useState<ReferralRoute[]>([])
  const [analysis, setAnalysis] = useState<RouteAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetCompany.trim()) return

    setLoading(true)
    setHasSearched(true)

    try {
      const response = await fetch('/api/referral-routes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetCompany }),
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

  const popularCompanies = [
    'chatwork', '株式会社Sopital', 'hackjpn', '株式会社HOKUTO', 'ホーミー'
  ]

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
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Network className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-serif font-bold text-gray-900">
              AI最適ルート提案
            </h1>
          </div>
          <p className="text-gray-600">
            AIが信頼関係を分析し、目標企業への最適な紹介ルートを提案します
          </p>
        </div>
      </div>

      <div className="container-narrow mx-auto px-4 py-8">
        {/* Search Section */}
        <div className="card p-8 mb-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              どちらの企業とつながりたいですか？
            </h2>
            <p className="text-gray-600">
              企業名を入力すると、AIが最適な紹介ルートを分析します
            </p>
          </div>

          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={targetCompany}
                  onChange={(e) => setTargetCompany(e.target.value)}
                  placeholder="企業名を入力してください（例: Google, Microsoft, Tesla...）"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !targetCompany.trim()}
                className="btn-dark px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    分析中...
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4" />
                    ルート分析
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Popular Companies */}
          <div className="mt-6">
            <p className="text-sm text-gray-600 mb-3 text-center">人気の企業:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {popularCompanies.map((company) => (
                <button
                  key={company}
                  onClick={() => setTargetCompany(company)}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                >
                  {company}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-3 text-blue-600">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-lg font-medium">AIが最適ルートを分析中...</span>
            </div>
            <p className="text-gray-600 mt-2">
              信頼関係とネットワークデータを解析しています
            </p>
          </div>
        )}

        {/* Results Section */}
        {hasSearched && !loading && (
          <>
            {analysis && analysis.totalRoutes > 0 && (
              <div className="card p-6 mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">分析結果サマリー</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{analysis.totalRoutes}</div>
                    <div className="text-sm text-gray-600">発見されたルート数</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round(analysis.averageSuccessRate * 100)}%
                    </div>
                    <div className="text-sm text-gray-600">平均成功率</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {analysis.bestRoute ? `${analysis.bestRoute.estimatedDays}日` : 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">最短予想期間</div>
                  </div>
                </div>
              </div>
            )}

            <ReferralRouteVisualization routes={routes} targetCompany={targetCompany} />
          </>
        )}

        {/* Feature Explanation */}
        {!hasSearched && (
          <div className="mt-12">
            <h3 className="text-xl font-bold text-center text-gray-800 mb-8">
              AI最適ルート提案の特徴
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Network className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-bold mb-2">信頼関係分析</h4>
                <p className="text-sm text-gray-600">
                  過去の取引実績や評価データから信頼度を数値化し、最も信頼できるルートを提案
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-bold mb-2">成功確率予測</h4>
                <p className="text-sm text-gray-600">
                  AIが過去のマッチング成功例を学習し、各ルートの成功確率を予測
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="font-bold mb-2">リアルタイム最適化</h4>
                <p className="text-sm text-gray-600">
                  ネットワークの変化をリアルタイムで反映し、常に最新の最適ルートを提案
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}