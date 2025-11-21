'use client'

import { useEffect, useState } from 'react'
import { Rating } from '@/components/Rating'
import { GradeDisplay } from '@/components/GradeDisplay'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Trophy, Medal, Award, TrendingUp, Building2, MapPin, Users, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface Company {
  _id: string
  name: string
  slug: string
  description: string
  logoUrl?: string
  website?: string
  industry: string
  foundedYear: number
  location: string
  employees: number
  trust: {
    total: number
    byRole: Record<string, number>
  }
  grade: 'A' | 'B' | 'C' | 'D' | 'E'
  createdAt: string
}

interface CompanyRankingProps {
  filterByRole?: string
  filterByIndustry?: string
  filterByPeriod?: string
  limit?: number
}

export function CompanyRanking({ filterByRole, filterByIndustry, filterByPeriod, limit = 50 }: CompanyRankingProps) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCompanies()
  }, [filterByRole, filterByIndustry, filterByPeriod, limit])

  const fetchCompanies = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterByRole) params.append('role', filterByRole)
      if (filterByIndustry) params.append('industry', filterByIndustry)
      if (filterByPeriod) params.append('period', filterByPeriod)
      params.append('limit', limit.toString())

      const res = await fetch(`/api/companies?${params}`)
      if (res.ok) {
        const data = await res.json()
        // 評価順でソート
        let filtered = data
        
        // 業界フィルター（クライアントサイドでも適用）
        if (filterByIndustry) {
          filtered = filtered.filter((company: Company) => 
            company.industry === filterByIndustry
          )
        }
        
        // 期間フィルター（クライアントサイドで適用）
        if (filterByPeriod) {
          const now = new Date()
          let cutoffDate: Date
          
          switch (filterByPeriod) {
            case '1month':
              cutoffDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
              break
            case '3months':
              cutoffDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
              break
            case '1year':
              cutoffDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
              break
            default:
              cutoffDate = new Date(0) // 全期間
          }
          
          filtered = filtered.filter((company: Company) => 
            new Date(company.createdAt) >= cutoffDate
          )
        }
        
        const sorted = filtered.sort((a: Company, b: Company) => b.trust.total - a.trust.total)
        setCompanies(sorted)
      } else {
        setError('企業データの取得に失敗しました')
      }
    } catch (error) {
      setError('エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />
      default:
        return (
          <div className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-600 bg-gray-100 rounded-full">
            {rank}
          </div>
        )
    }
  }

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white'
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white'
      case 3:
        return 'bg-gradient-to-r from-amber-400 to-amber-600 text-white'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse flex space-x-4">
                <div className="rounded-full bg-gray-200 h-12 w-12"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (companies.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">企業がありません</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {companies.map((company, index) => {
        const rank = index + 1
        const roleKeys = Object.keys(company.trust.byRole)
        const avgRating = company.trust.total

        return (
          <Card key={company._id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {/* ランク表示 */}
                <div className="flex-shrink-0 flex flex-col items-center">
                  {getRankIcon(rank)}
                  <Badge className={`mt-2 text-xs px-2 py-1 ${getRankBadgeColor(rank)}`}>
                    #{rank}
                  </Badge>
                </div>

                {/* 企業ロゴ */}
                <div className="flex-shrink-0">
                  {company.logoUrl ? (
                    <img 
                      src={company.logoUrl} 
                      alt={company.name}
                      className="w-16 h-16 rounded-lg object-cover border"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* 企業情報 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <Link 
                        href={`/company/${company.slug}`}
                        className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
                      >
                        {company.name}
                      </Link>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {company.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {company.employees}名
                        </span>
                        <span>{company.foundedYear}年設立</span>
                      </div>
                    </div>
                    {company.website && (
                      <a 
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {company.description}
                  </p>

                  {/* 評価とバッジ */}
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Rating value={avgRating} readonly size="sm" />
                      <span className="text-sm font-medium text-gray-700">
                        {avgRating.toFixed(1)}
                      </span>
                      <GradeDisplay grade={company.grade} size="md" showLabel />
                    </div>
                    
                    <Badge variant="secondary" className="text-xs">
                      {company.industry}
                    </Badge>

                    {roleKeys.length > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">評価者:</span>
                        {roleKeys.slice(0, 3).map((role) => (
                          <Badge key={role} variant="outline" className="text-xs">
                            {getRoleLabel(role)}
                          </Badge>
                        ))}
                        {roleKeys.length > 3 && (
                          <span className="text-xs text-gray-400">+{roleKeys.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 特別な指標（トップ3のみ） */}
                  {rank <= 3 && (
                    <div className="mt-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-600 font-medium">
                        {rank === 1 && "最高評価企業"}
                        {rank === 2 && "注目の成長企業"}
                        {rank === 3 && "優秀企業"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function getRoleLabel(role: string): string {
  const roleMap: Record<string, string> = {
    'Founder': '創業者',
    'Employee': '従業員',
    'Investor': '投資家',
    'Advisor': 'アドバイザー',
    'Customer': '顧客',
    'Fan': 'ファン',
  }
  return roleMap[role] || role
}