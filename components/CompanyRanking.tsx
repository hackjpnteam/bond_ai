'use client'

import { useEffect, useState } from 'react'
import { Rating } from '@/components/Rating'
import { GradeDisplay } from '@/components/GradeDisplay'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Trophy, Medal, Award, TrendingUp, Building2, MapPin, Users } from 'lucide-react'
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
        let filtered = data

        if (filterByIndustry) {
          filtered = filtered.filter((company: Company) =>
            company.industry === filterByIndustry
          )
        }

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
              cutoffDate = new Date(0)
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
        return <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
      case 2:
        return <Medal className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
      case 3:
        return <Award className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
      default:
        return (
          <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-xs sm:text-sm font-bold text-gray-600 bg-gray-100 rounded-full">
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
      <div className="space-y-3 sm:space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-3 sm:p-6">
              <div className="animate-pulse flex space-x-3 sm:space-x-4">
                <div className="rounded-full bg-gray-200 h-10 w-10 sm:h-12 sm:w-12"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/2"></div>
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
        <CardContent className="p-6 sm:p-8 text-center">
          <p className="text-gray-500 text-sm sm:text-base">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (companies.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 sm:p-8 text-center">
          <Building2 className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3 sm:mb-4" />
          <p className="text-gray-500 text-sm sm:text-base">企業がありません</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {companies.map((company, index) => {
        const rank = index + 1
        const roleKeys = Object.keys(company.trust.byRole)
        const avgRating = company.trust.total

        return (
          <Link key={company._id} href={`/company/${company.slug}`} className="block">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-start gap-2 sm:gap-4">
                  {/* ランク表示 */}
                  <div className="flex-shrink-0 flex flex-col items-center">
                    {getRankIcon(rank)}
                    <Badge className={`mt-1 sm:mt-2 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 ${getRankBadgeColor(rank)}`}>
                      #{rank}
                    </Badge>
                  </div>

                  {/* 企業ロゴ */}
                  <div className="flex-shrink-0">
                    <img
                      src={company.logoUrl || `/api/company-logo/${encodeURIComponent(company.slug)}`}
                      alt={company.name}
                      className="w-10 h-10 sm:w-16 sm:h-16 rounded-lg object-contain border bg-white p-0.5 sm:p-1"
                      onError={(e) => {
                        e.currentTarget.src = '/bond-logo.png';
                        e.currentTarget.onerror = null;
                      }}
                    />
                  </div>

                  {/* 企業情報 */}
                  <div className="flex-1 min-w-0">
                    <div className="mb-1 sm:mb-2">
                      <h3 className="text-sm sm:text-xl font-bold text-gray-900 truncate">
                        {company.name}
                      </h3>
                      <div className="flex items-center gap-2 sm:gap-4 mt-0.5 sm:mt-1 text-[10px] sm:text-sm text-gray-500">
                        <span className="flex items-center gap-0.5 sm:gap-1">
                          <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          {company.location}
                        </span>
                        <span className="flex items-center gap-0.5 sm:gap-1">
                          <Users className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          {company.employees}名
                        </span>
                        <span className="hidden sm:inline">{company.foundedYear}年設立</span>
                      </div>
                    </div>

                    <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-1 sm:line-clamp-2">
                      {company.description}
                    </p>

                    {/* 評価とバッジ */}
                    <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <Rating value={avgRating} readonly size="sm" />
                        <span className="text-xs sm:text-sm font-medium text-gray-700">
                          {avgRating.toFixed(1)}
                        </span>
                        <GradeDisplay grade={company.grade} size="sm" showLabel={false} />
                      </div>

                      <Badge variant="secondary" className="text-[10px] sm:text-xs">
                        {company.industry}
                      </Badge>
                    </div>

                    {/* 特別な指標（トップ3のみ） */}
                    {rank <= 3 && (
                      <div className="mt-2 sm:mt-3 flex items-center gap-1 sm:gap-2">
                        <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                        <span className="text-[10px] sm:text-sm text-green-600 font-medium">
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
          </Link>
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
