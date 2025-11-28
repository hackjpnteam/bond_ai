'use client'

import { useEffect, useState } from 'react'
import { Trophy, Medal, Award } from 'lucide-react'
import Link from 'next/link'
import { Rating } from '@/components/Rating'
import { Badge } from '@/components/ui/badge'

interface TopCompany {
  name: string
  slug: string
  industry?: string
  description?: string
  logoUrl?: string
  website?: string
  averageRating: number
  reviewCount: number
  weightedScore: number
  grade?: string
}

const rankStyles = [
  {
    border: 'border-yellow-400',
    gradient: 'from-yellow-50 to-white',
    iconColor: 'text-yellow-500',
    labelColor: 'text-yellow-600',
    badgeClass: 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white',
    icon: Trophy
  },
  {
    border: 'border-gray-400',
    gradient: 'from-gray-50 to-white',
    iconColor: 'text-gray-500',
    labelColor: 'text-gray-600',
    badgeClass: 'bg-gradient-to-r from-gray-400 to-gray-600 text-white',
    icon: Medal
  },
  {
    border: 'border-orange-400',
    gradient: 'from-orange-50 to-white',
    iconColor: 'text-orange-500',
    labelColor: 'text-orange-600',
    badgeClass: 'bg-gradient-to-r from-orange-400 to-orange-600 text-white',
    icon: Award
  }
]

function getScoreValue(company: TopCompany) {
  return company.averageRating ?? 0
}

export function TopCompaniesHighlight() {
  const [companies, setCompanies] = useState<TopCompany[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTopCompanies = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/ranking/top', { cache: 'no-store' })
        if (!response.ok) {
          throw new Error('企業データの取得に失敗しました')
        }
        const data = await response.json()
        if (!data.success) {
          throw new Error(data.error || 'ランキングの取得に失敗しました')
        }
        setCompanies(data.companies || [])
      } catch (err: any) {
        setError(err.message || 'ランキングの取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchTopCompanies()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="card p-4 md:p-6 border-2 border-dashed border-ash-line animate-pulse">
            <div className="h-5 md:h-6 bg-ash-surface rounded mb-3 md:mb-4"></div>
            <div className="h-4 bg-ash-surface rounded mb-2 w-1/2"></div>
            <div className="h-4 bg-ash-surface rounded w-1/3"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error || companies.length === 0) {
    return (
      <div className="card p-4 md:p-6 text-center mb-6 md:mb-8">
        <p className="text-xs md:text-sm text-ash-muted">{error || 'ランキングデータが見つかりませんでした。'}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
      {companies.map((company, index) => {
        const style = rankStyles[index] || rankStyles[rankStyles.length - 1]
        const Icon = style.icon
        const score = getScoreValue(company)

        return (
          <div
            key={company.slug}
            className={`card p-4 md:p-6 border-2 bg-gradient-to-br ${style.border} ${style.gradient}`}
          >
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="flex items-center gap-1.5 md:gap-2">
                <Icon className={`w-6 h-6 md:w-8 md:h-8 ${style.iconColor}`} />
                <span className={`text-lg md:text-2xl font-bold ${style.labelColor}`}>
                  {index === 0 ? '1st' : index === 1 ? '2nd' : '3rd'}
                </span>
              </div>
              <Badge className={`${style.badgeClass} border-0 text-xs`}>
                総合評価{company.grade || 'A'}
              </Badge>
            </div>
            <h3 className="text-base md:text-xl font-bold mb-1.5 md:mb-2 truncate">{company.name}</h3>
            {company.industry && (
              <p className="text-xs md:text-sm text-ash-muted mb-2 md:mb-3">{company.industry}</p>
            )}
              <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
                <Rating value={score} readonly size="sm" />
                <span className="text-ash-muted text-xs md:text-sm font-medium">{score.toFixed(1)}</span>
                <span className="text-xs text-ash-muted">× {company.reviewCount.toLocaleString()}</span>
              </div>
              <div className="text-xs text-ash-muted mt-1">
                スコア: <span className="font-semibold text-ash-text">{company.weightedScore.toFixed(1)}</span>
              </div>
            <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t flex items-center justify-between">
              <Link
                href={`/company/${company.slug}`}
                className="text-xs md:text-sm text-blue-600 hover:text-blue-800 py-1"
              >
                詳細を見る →
              </Link>
            </div>
          </div>
        )
      })}
    </div>
  )
}
