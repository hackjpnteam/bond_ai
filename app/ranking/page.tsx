'use client'

import { useState } from 'react'
import { CompanyRanking } from '@/components/CompanyRanking'
import { Badge } from '@/components/ui/badge'
import { Trophy, Filter } from 'lucide-react'

export default function RankingPage() {
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [selectedIndustry, setSelectedIndustry] = useState<string>('')
  const [selectedPeriod, setSelectedPeriod] = useState<string>('')

  const roles = [
    { key: '', label: 'すべて' },
    { key: 'Founder', label: '創業者' },
    { key: 'Employee', label: '従業員' },
    { key: 'Investor', label: '投資家' },
    { key: 'Advisor', label: 'アドバイザー' },
    { key: 'Customer', label: '顧客' },
    { key: 'Fan', label: 'ファン' }
  ]

  const industries = [
    { key: '', label: 'すべて' },
    { key: 'AI・機械学習', label: 'AI' },
    { key: 'ヘルステック', label: 'ヘルス' },
    { key: 'SaaS・プラットフォーム', label: 'SaaS' },
    { key: '不動産テック', label: '不動産' },
    { key: 'FinTech', label: 'FinTech' },
    { key: 'EdTech', label: 'EdTech' },
    { key: 'コンサルティング', label: 'コンサル' },
    { key: 'エネルギー', label: 'エネルギー' }
  ]

  const periods = [
    { key: '', label: '全期間' },
    { key: '1month', label: '1ヶ月' },
    { key: '3months', label: '3ヶ月' },
    { key: '1year', label: '1年' }
  ]

  return (
    <div className="min-h-screen">
      <div className="container-narrow mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* ヘッダー */}
        <div className="text-center mb-4 sm:mb-8">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-4">
            <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500" />
            <h1 className="text-xl sm:text-3xl font-bold text-ash-text">企業ランキング</h1>
          </div>
          <p className="text-xs sm:text-base text-ash-muted max-w-2xl mx-auto leading-relaxed px-2">
            信頼度とユーザー評価に基づく企業ランキング
          </p>
        </div>

        {/* フィルター */}
        <div className="bg-white/60 backdrop-blur-2xl rounded-xl border border-ash-line/30 p-3 sm:p-6 mb-4 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-ash-muted" />
            <h2 className="text-sm sm:text-lg font-semibold text-ash-text">フィルター</h2>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-ash-text mb-1.5 sm:mb-2">
                役割
              </label>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {roles.map((role) => (
                  <button
                    key={role.key}
                    onClick={() => setSelectedRole(role.key)}
                    className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                      selectedRole === role.key
                        ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                        : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    {role.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-ash-text mb-1.5 sm:mb-2">
                業界
              </label>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {industries.map((industry) => (
                  <button
                    key={industry.key}
                    onClick={() => setSelectedIndustry(industry.key)}
                    className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                      selectedIndustry === industry.key
                        ? 'bg-green-100 text-green-800 border-2 border-green-300'
                        : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    {industry.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-ash-text mb-1.5 sm:mb-2">
                期間
              </label>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {periods.map((period) => (
                  <button
                    key={period.key}
                    onClick={() => setSelectedPeriod(period.key)}
                    className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                      selectedPeriod === period.key
                        ? 'bg-purple-100 text-purple-800 border-2 border-purple-300'
                        : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 統計情報 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-8">
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg sm:rounded-xl p-3 sm:p-6 text-white">
            <div className="flex items-center gap-2 sm:gap-3">
              <Trophy className="w-5 h-5 sm:w-8 sm:h-8" />
              <div>
                <div className="text-lg sm:text-2xl font-bold">1位</div>
                <div className="text-xs sm:text-base text-yellow-100">ギグー</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-lg sm:rounded-xl p-3 sm:p-6 text-white">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-5 h-5 sm:w-8 sm:h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-xs sm:text-sm font-bold">★</span>
              </div>
              <div>
                <div className="text-lg sm:text-2xl font-bold">4.5</div>
                <div className="text-xs sm:text-base text-blue-100">平均評価</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-emerald-500 to-emerald-700 rounded-lg sm:rounded-xl p-3 sm:p-6 text-white">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-5 h-5 sm:w-8 sm:h-8 bg-white/20 rounded-full flex items-center justify-center font-bold text-xs sm:text-base">
                A
              </div>
              <div>
                <div className="text-lg sm:text-2xl font-bold">60%</div>
                <div className="text-xs sm:text-base text-emerald-100">評価A</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-700 rounded-lg sm:rounded-xl p-3 sm:p-6 text-white">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-5 h-5 sm:w-8 sm:h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-xs sm:text-sm font-bold">#</span>
              </div>
              <div>
                <div className="text-lg sm:text-2xl font-bold">5</div>
                <div className="text-xs sm:text-base text-purple-100">企業数</div>
              </div>
            </div>
          </div>
        </div>

        {/* ランキング表示 */}
        <div className="bg-white/60 backdrop-blur-2xl rounded-xl border border-ash-line/30 p-3 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-6">
            <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
            <h2 className="text-base sm:text-xl font-semibold text-ash-text">
              {selectedRole || selectedIndustry || selectedPeriod ?
                `${selectedIndustry && industries.find(i => i.key === selectedIndustry)?.label || ''}${selectedIndustry && (selectedRole || selectedPeriod) ? ' × ' : ''}${selectedRole && roles.find(r => r.key === selectedRole)?.label || ''}${selectedRole && selectedPeriod ? ' × ' : ''}${selectedPeriod && periods.find(p => p.key === selectedPeriod)?.label || ''}ランキング`
                : '総合ランキング'}
            </h2>
          </div>

          <CompanyRanking
            filterByRole={selectedRole || undefined}
            filterByIndustry={selectedIndustry || undefined}
            filterByPeriod={selectedPeriod || undefined}
          />
        </div>

        {/* 注意事項 */}
        <div className="mt-4 sm:mt-8 bg-blue-50 border border-blue-200 rounded-lg sm:rounded-xl p-3 sm:p-4">
          <h3 className="font-semibold text-blue-900 mb-1 sm:mb-2 text-sm sm:text-base">ランキングについて</h3>
          <ul className="text-xs sm:text-sm text-blue-800 space-y-0.5 sm:space-y-1">
            <li>• 信頼度スコアと評価に基づいて算出</li>
            <li>• 実際のユーザーによる投稿を基に評価</li>
            <li>• 定期的に更新</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
