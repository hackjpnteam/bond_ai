'use client'

import React from 'react'
import { ArrowRight, Users, Star, Clock, TrendingUp, Award, Target } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

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

interface ReferralRouteVisualizationProps {
  routes: ReferralRoute[]
  targetCompany: string
}

export function ReferralRouteVisualization({ routes, targetCompany }: ReferralRouteVisualizationProps) {
  // ルートが見つからない場合はセクション自体を非表示
  if (!routes || routes.length === 0) {
    return null
  }

  const getSuccessColor = (probability: number) => {
    if (probability >= 0.8) return 'text-green-600 bg-green-50'
    if (probability >= 0.6) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 0.9) return 'text-emerald-600'
    if (efficiency >= 0.7) return 'text-blue-600'
    return 'text-gray-600'
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="text-center mb-4 md:mb-6">
        <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-1 md:mb-2">
          「{targetCompany}」への最適ルート
        </h3>
        <p className="text-xs md:text-sm text-gray-600">
          信頼スコアと効率性に基づいて最適な紹介ルートをAIが提案します
        </p>
      </div>

      {routes.map((route, routeIndex) => (
        <div key={routeIndex} className="card p-4 md:p-6 border-l-4 border-l-blue-500">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 md:gap-4 mb-3 md:mb-4">
            <div className="flex items-center gap-2">
              <Badge className={`text-xs ${routeIndex === 0 ? 'bg-gold text-gold-foreground' : 'bg-gray-100 text-gray-800'}`}>
                {routeIndex === 0 ? '最推奨' : `ルート${routeIndex + 1}`}
              </Badge>
              {routeIndex === 0 && <Award className="w-4 h-4 text-yellow-500" />}
            </div>
            <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm">
              <div className="flex items-center gap-1">
                <Target className="w-3 h-3 md:w-4 md:h-4 text-blue-500" />
                <span className={`font-medium ${getEfficiencyColor(route.efficiency)}`}>
                  効率 {Math.round(route.efficiency * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-green-500" />
                <span className={`font-medium px-1.5 md:px-2 py-0.5 md:py-1 rounded ${getSuccessColor(route.successProbability)}`}>
                  成功率 {Math.round(route.successProbability * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 md:w-4 md:h-4 text-purple-500" />
                <span className="font-medium text-purple-600">
                  約{route.estimatedDays}日
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1 md:space-x-2 overflow-x-auto pb-2 -mx-2 px-2">
            {/* Starting point */}
            <div className="flex-shrink-0 text-center">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-full flex items-center justify-center mb-1 md:mb-2">
                <Users className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
              </div>
              <div className="text-[10px] md:text-xs font-medium text-gray-700">あなた</div>
            </div>

            {/* Route connections */}
            {route.path.map((connection, connIndex) => (
              <React.Fragment key={connection.id}>
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5 text-gray-400 flex-shrink-0" />

                <div className="flex-shrink-0 text-center min-w-[80px] md:min-w-[120px]">
                  <div className="relative p-0.5 md:p-1 mb-1 md:mb-2">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto">
                      <div className="text-base md:text-lg font-bold text-purple-700">
                        {connection.name.charAt(0)}
                      </div>
                    </div>
                    <div className="absolute top-0 right-0 md:right-2 w-5 h-5 md:w-6 md:h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                      <Star className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
                    </div>
                  </div>

                  <div className="space-y-0.5 md:space-y-1">
                    <div className="text-xs md:text-sm font-medium text-gray-800 truncate max-w-[80px] md:max-w-[120px]">
                      {connection.name}
                    </div>
                    <div className="text-[10px] md:text-xs text-gray-600 truncate">
                      {connection.position}
                    </div>
                    <div className="text-[10px] md:text-xs text-blue-600 font-medium truncate">
                      {connection.company}
                    </div>
                    <div className="flex items-center justify-center gap-0.5 md:gap-1">
                      <Star className="w-2.5 h-2.5 md:w-3 md:h-3 text-yellow-500" />
                      <span className="text-[10px] md:text-xs font-medium text-yellow-600">
                        {connection.trustScore}
                      </span>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            ))}

            <ArrowRight className="w-4 h-4 md:w-5 md:h-5 text-gray-400 flex-shrink-0" />

            {/* Target company */}
            <div className="flex-shrink-0 text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mb-1 md:mb-2">
                <Target className="w-6 h-6 md:w-8 md:h-8 text-green-600" />
              </div>
              <div className="text-xs md:text-sm font-bold text-green-700 truncate max-w-[80px] md:max-w-[120px]">{targetCompany}</div>
              <div className="text-[10px] md:text-xs text-gray-600">目標企業</div>
            </div>
          </div>

          <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-gray-100">
            <div className="grid grid-cols-4 gap-2 md:gap-4 text-center">
              <div>
                <div className="text-base md:text-lg font-bold text-blue-600">
                  {route.totalTrustScore.toFixed(1)}
                </div>
                <div className="text-[10px] md:text-xs text-gray-600">信頼スコア</div>
              </div>
              <div>
                <div className="text-base md:text-lg font-bold text-green-600">
                  {Math.round(route.successProbability * 100)}%
                </div>
                <div className="text-[10px] md:text-xs text-gray-600">成功確率</div>
              </div>
              <div>
                <div className="text-base md:text-lg font-bold text-purple-600">
                  {route.estimatedDays}日
                </div>
                <div className="text-[10px] md:text-xs text-gray-600">予想期間</div>
              </div>
              <div>
                <div className="text-base md:text-lg font-bold text-orange-600">
                  {route.path.length}
                </div>
                <div className="text-[10px] md:text-xs text-gray-600">経由人数</div>
              </div>
            </div>
          </div>

          {routeIndex === 0 && (
            <div className="mt-3 md:mt-4 p-2.5 md:p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
                <Award className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-600" />
                <span className="text-xs md:text-sm font-medium text-blue-800">AIの推奨理由</span>
              </div>
              <p className="text-xs md:text-sm text-blue-700 leading-relaxed">
                信頼スコア{route.totalTrustScore.toFixed(1)}、効率性{Math.round(route.efficiency * 100)}%の最適ルート。
                {route.path.length === 1 ? '直接のコネクションで' : '信頼できる仲介者経由で'}
                成功率{Math.round(route.successProbability * 100)}%。
              </p>
            </div>
          )}
        </div>
      ))}

      <div className="text-center mt-4 md:mt-6 p-3 md:p-4 bg-gray-50 rounded-lg">
        <p className="text-xs md:text-sm text-gray-600 mb-1 md:mb-2">
          💡 <strong>ヒント:</strong> 最適なルートを選択し、段階的にアプローチすることで成功確率が向上します
        </p>
        <p className="text-[10px] md:text-xs text-gray-500">
          信頼スコアは過去の取引実績、評価、相互の関係性などを総合的に分析して算出されています
        </p>
      </div>
    </div>
  )
}