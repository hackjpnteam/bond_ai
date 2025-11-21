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
    { key: '', label: 'すべて業界' },
    { key: 'AI・機械学習', label: 'AI・機械学習' },
    { key: 'コンサルティング', label: 'コンサルティング' },
    { key: 'プラットフォーム', label: 'プラットフォーム' },
    { key: 'FinTech', label: 'FinTech' },
    { key: 'ヘルステック', label: 'ヘルステック' },
    { key: 'EdTech', label: 'EdTech' },
    { key: 'エネルギー', label: 'エネルギー' }
  ]

  const periods = [
    { key: '', label: '全期間' },
    { key: '1month', label: '直近1ヶ月' },
    { key: '3months', label: '直近3ヶ月' },
    { key: '1year', label: '直近1年' }
  ]

  return (
    <div className="min-h-screen">
      <div className="container-narrow mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <h1 className="text-3xl font-bold text-ash-text">企業ランキング</h1>
          </div>
          <p className="text-ash-muted max-w-2xl mx-auto leading-relaxed">
            信頼度とユーザー評価に基づく企業ランキング。
            透明性の高い評価システムで、優秀な企業を発見しましょう。
          </p>
        </div>

        {/* フィルター */}
        <div className="bg-white/60 backdrop-blur-2xl rounded-xl border border-ash-line/30 p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Filter className="w-5 h-5 text-ash-muted" />
            <h2 className="text-lg font-semibold text-ash-text">フィルター</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ash-text mb-2">
                評価者の役割で絞り込み
              </label>
              <div className="flex flex-wrap gap-2">
                {roles.map((role) => (
                  <button
                    key={role.key}
                    onClick={() => setSelectedRole(role.key)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
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
              <label className="block text-sm font-medium text-ash-text mb-2">
                業界で絞り込み
              </label>
              <div className="flex flex-wrap gap-2">
                {industries.map((industry) => (
                  <button
                    key={industry.key}
                    onClick={() => setSelectedIndustry(industry.key)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
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
              <label className="block text-sm font-medium text-ash-text mb-2">
                期間で絞り込み
              </label>
              <div className="flex flex-wrap gap-2">
                {periods.map((period) => (
                  <button
                    key={period.key}
                    onClick={() => setSelectedPeriod(period.key)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-xl p-6 text-white">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8" />
              <div>
                <div className="text-2xl font-bold">1位</div>
                <div className="text-yellow-100">ギグー</div>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-xl p-6 text-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold">★</span>
              </div>
              <div>
                <div className="text-2xl font-bold">4.7</div>
                <div className="text-blue-100">平均評価</div>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-700 rounded-xl p-6 text-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-bold">
                A
              </div>
              <div>
                <div className="text-2xl font-bold">100%</div>
                <div className="text-emerald-100">総合評価A</div>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500 to-purple-700 rounded-xl p-6 text-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold">#</span>
              </div>
              <div>
                <div className="text-2xl font-bold">3</div>
                <div className="text-purple-100">掲載企業数</div>
              </div>
            </div>
          </div>
        </div>

        {/* ランキング表示 */}
        <div className="bg-white/60 backdrop-blur-2xl rounded-xl border border-ash-line/30 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <h2 className="text-xl font-semibold text-ash-text">
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
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-semibold text-blue-900 mb-2">ランキングについて</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• ランキングは各企業の信頼度スコアと評価に基づいて算出されています</li>
            <li>• 評価は実際のユーザーによる投稿を基にしており、透明性を重視しています</li>
            <li>• 定期的に更新され、最新の評価状況を反映しています</li>
          </ul>
        </div>
      </div>
    </div>
  )
}