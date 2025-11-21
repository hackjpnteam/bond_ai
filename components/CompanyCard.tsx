'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CompanyDoc, RoleTag } from '@/lib/models'
import { Building2, TrendingUp } from 'lucide-react'
import { Rating } from '@/components/Rating'

interface CompanyCardProps {
  company: CompanyDoc
}

const roleBadgeColors: Record<RoleTag, string> = {
  Investor: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
  Employee: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  Founder: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  Customer: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
  Advisor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
  Fan: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'
}

export function CompanyCard({ company }: CompanyCardProps) {
  const trustScore = company.trust?.total || 0
  const byRole = company.trust?.byRole || {}
  const rating = company.rating || 0
  const totalRatings = company.totalRatings || 0

  return (
    <Link href={`/dashboard/companies/${company._id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {company.logoUrl ? (
                <img src={company.logoUrl} alt={company.name} className="w-12 h-12 rounded-lg object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-gray-500" />
                </div>
              )}
              <div>
                <CardTitle className="text-xl">{company.name}</CardTitle>
                {company.stage && (
                  <Badge variant="outline" className="mt-1">{company.stage}</Badge>
                )}
                <div className="mt-2">
                  <Rating 
                    value={rating} 
                    readonly 
                    size="sm" 
                    showValue 
                    totalRatings={totalRatings}
                  />
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-2xl font-bold">
                <TrendingUp className="w-5 h-5" />
                {trustScore}
              </div>
              <p className="text-xs text-muted-foreground">Trust Score</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {company.category && company.category.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {company.category.map(cat => (
                  <Badge key={cat} variant="secondary">{cat}</Badge>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {Object.entries(byRole).map(([role, count]) => count > 0 && (
                <div key={role} className={`px-2 py-1 rounded-md text-xs font-medium ${roleBadgeColors[role as RoleTag]}`}>
                  {role}: {count}
                </div>
              ))}
            </div>
            {company.website && (
              <CardDescription className="text-xs">
                {company.website}
              </CardDescription>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}