import { notFound } from 'next/navigation'
import { getCollection } from '@/lib/db'
import { CompanyDoc, SubmissionDoc } from '@/lib/models'
import { ObjectId } from 'mongodb'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrustBadges } from '@/components/TrustBadges'
import { SubmissionCard } from '@/components/SubmissionCard'
import { CompanyRating } from '@/components/CompanyRating'
import Link from 'next/link'
import { ArrowLeft, Building2, Globe, TrendingUp } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CompanyDetailPage({ params }: PageProps) {
  const { id } = await params
  let companyId: ObjectId
  try {
    companyId = new ObjectId(id)
  } catch {
    notFound()
  }

  const companies = await getCollection<CompanyDoc>('companies')
  const company = await companies.findOne({ _id: companyId })
  
  if (!company) {
    notFound()
  }

  const submissions = await getCollection<SubmissionDoc>('submissions')
  const submissionList = await submissions
    .find({ companyId, status: 'published' })
    .sort({ createdAt: -1 })
    .toArray()

  const employeeSubmissions = submissionList.filter(s => s.role === 'Employee')

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm hover:opacity-80">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    {company.logoUrl ? (
                      <img src={company.logoUrl} alt={company.name} className="w-16 h-16 rounded-lg object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-gray-500" />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-2xl">{company.name}</CardTitle>
                      {company.stage && (
                        <Badge variant="outline" className="mt-2">{company.stage}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-3xl font-bold">
                      <TrendingUp className="w-6 h-6" />
                      {company.trust?.total || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">Trust Score</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {company.website && (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <Globe className="w-4 h-4" />
                      {company.website}
                    </a>
                  )}
                  {company.category && company.category.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {company.category.map(cat => (
                        <Badge key={cat} variant="secondary">{cat}</Badge>
                      ))}
                    </div>
                  )}
                  {company.trust?.byRole && (
                    <div>
                      <p className="text-sm font-medium mb-2">Trust Breakdown</p>
                      <TrustBadges byRole={company.trust.byRole} />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="voices">Employee Voices</TabsTrigger>
                <TabsTrigger value="graph">Relationship Graph</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>All Endorsements</CardTitle>
                    <CardDescription>
                      Verified relationships and endorsements
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {submissionList.length === 0 ? (
                      <p className="text-muted-foreground">No endorsements yet</p>
                    ) : (
                      <div className="space-y-4">
                        {submissionList.map(submission => (
                          <SubmissionCard
                            key={submission._id.toString()}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            submission={submission as any}
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="voices" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Employee Voices</CardTitle>
                    <CardDescription>
                      Hear from team members about their experience
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {employeeSubmissions.length === 0 ? (
                      <p className="text-muted-foreground">No employee endorsements yet</p>
                    ) : (
                      <div className="space-y-4">
                        {employeeSubmissions.map(submission => (
                          <SubmissionCard
                            key={submission._id.toString()}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            submission={submission as any}
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="graph">
                <Card>
                  <CardHeader>
                    <CardTitle>Relationship Graph</CardTitle>
                    <CardDescription>
                      Visual representation of company relationships
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96 bg-muted rounded-lg flex items-center justify-center">
                      <p className="text-muted-foreground">Graph visualization coming soon</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <CompanyRating 
              companyId={company._id.toString()}
              initialRating={company.rating || 0}
              totalRatings={company.totalRatings || 0}
            />
            
            <Card>
              <CardHeader>
                <CardTitle>Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-2xl font-bold">{submissionList.length}</p>
                  <p className="text-sm text-muted-foreground">Total Endorsements</p>
                </div>
                {company.metrics?.nps && (
                  <div>
                    <p className="text-2xl font-bold">{company.metrics.nps}</p>
                    <p className="text-sm text-muted-foreground">NPS Score</p>
                  </div>
                )}
                {company.metrics?.mrr && (
                  <div>
                    <p className="text-2xl font-bold">${company.metrics.mrr.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Monthly Recurring Revenue</p>
                  </div>
                )}
                {company.metrics?.growthRate3m && (
                  <div>
                    <p className="text-2xl font-bold">{company.metrics.growthRate3m}%</p>
                    <p className="text-sm text-muted-foreground">3-Month Growth</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Supporters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {submissionList
                    .filter(s => s.role === 'Investor' || s.role === 'Founder')
                    .slice(0, 5)
                    .map(submission => (
                      <div key={submission._id.toString()} className="flex items-center justify-between">
                        <Badge variant="outline">{submission.role}</Badge>
                        {submission.metadata?.fundName && (
                          <span className="text-sm">{submission.metadata.fundName}</span>
                        )}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}