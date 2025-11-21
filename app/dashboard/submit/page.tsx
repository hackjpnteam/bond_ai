'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

type RoleTag = 'Founder' | 'Employee' | 'Investor' | 'Advisor' | 'Customer' | 'Fan'

export default function SubmitPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [companyData, setCompanyData] = useState({
    name: '',
    slug: '',
    website: '',
    stage: 'Seed' as 'Pre-Seed' | 'Seed' | 'A' | 'B' | 'C' | 'Growth'
  })
  const [submissionData, setSubmissionData] = useState({
    role: '' as RoleTag | '',
    comment: '',
    metadata: {
      employeeTitle: '',
      joinedYear: '',
      fundName: '',
      customerPlan: ''
    }
  })

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyData)
      })

      if (!res.ok) {
        const error = await res.json()
        alert(error.error || 'Failed to create company')
        return
      }

      const company = await res.json()
      
      if (submissionData.role && submissionData.comment) {
        const subRes = await fetch('/api/submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyId: company._id,
            role: submissionData.role,
            comment: submissionData.comment,
            metadata: submissionData.metadata
          })
        })

        if (!subRes.ok) {
          const error = await subRes.json()
          alert(error.error || 'Company created but submission failed')
        }
      }

      router.push('/dashboard')
    } catch (error) {
      alert('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const roles: RoleTag[] = ['Founder', 'Employee', 'Investor', 'Advisor', 'Customer', 'Fan']

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

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Submit Your Company</CardTitle>
            <CardDescription>
              Add your company and optionally include your endorsement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCompanySubmit} className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold">Company Information</h3>
                
                <div>
                  <Label htmlFor="name">Company Name *</Label>
                  <Input
                    id="name"
                    required
                    value={companyData.name}
                    onChange={e => setCompanyData({ ...companyData, name: e.target.value })}
                    placeholder="Acme Inc."
                  />
                </div>

                <div>
                  <Label htmlFor="slug">URL Slug *</Label>
                  <Input
                    id="slug"
                    required
                    pattern="^[a-z0-9-]+$"
                    value={companyData.slug}
                    onChange={e => setCompanyData({ ...companyData, slug: e.target.value.toLowerCase() })}
                    placeholder="acme-inc"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Lowercase letters, numbers, and hyphens only
                  </p>
                </div>

                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={companyData.website}
                    onChange={e => setCompanyData({ ...companyData, website: e.target.value })}
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="stage">Stage</Label>
                  <select
                    id="stage"
                    className="w-full px-3 py-2 border rounded-md"
                    value={companyData.stage}
                    onChange={e => setCompanyData({ ...companyData, stage: e.target.value as 'Pre-Seed' | 'Seed' | 'A' | 'B' | 'C' | 'Growth' })}
                  >
                    <option value="Pre-Seed">Pre-Seed</option>
                    <option value="Seed">Seed</option>
                    <option value="A">Series A</option>
                    <option value="B">Series B</option>
                    <option value="C">Series C</option>
                    <option value="Growth">Growth</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Your Relationship (Optional)</h3>
                
                <div>
                  <Label>Your Role</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {roles.map(role => (
                      <Badge
                        key={role}
                        variant={submissionData.role === role ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => setSubmissionData({ ...submissionData, role })}
                      >
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>

                {submissionData.role && (
                  <>
                    <div>
                      <Label htmlFor="comment">Your Endorsement</Label>
                      <Textarea
                        id="comment"
                        value={submissionData.comment}
                        onChange={e => setSubmissionData({ ...submissionData, comment: e.target.value })}
                        placeholder="Share your experience with this company..."
                        rows={4}
                      />
                    </div>

                    {submissionData.role === 'Employee' && (
                      <>
                        <div>
                          <Label htmlFor="title">Your Title</Label>
                          <Input
                            id="title"
                            value={submissionData.metadata.employeeTitle}
                            onChange={e => setSubmissionData({
                              ...submissionData,
                              metadata: { ...submissionData.metadata, employeeTitle: e.target.value }
                            })}
                            placeholder="Software Engineer"
                          />
                        </div>
                        <div>
                          <Label htmlFor="year">Year Joined</Label>
                          <Input
                            id="year"
                            type="number"
                            min="1900"
                            max="2100"
                            value={submissionData.metadata.joinedYear}
                            onChange={e => setSubmissionData({
                              ...submissionData,
                              metadata: { ...submissionData.metadata, joinedYear: e.target.value }
                            })}
                            placeholder="2023"
                          />
                        </div>
                      </>
                    )}

                    {submissionData.role === 'Investor' && (
                      <div>
                        <Label htmlFor="fund">Fund Name</Label>
                        <Input
                          id="fund"
                          value={submissionData.metadata.fundName}
                          onChange={e => setSubmissionData({
                            ...submissionData,
                            metadata: { ...submissionData.metadata, fundName: e.target.value }
                          })}
                          placeholder="Sequoia Capital"
                        />
                      </div>
                    )}

                    {submissionData.role === 'Customer' && (
                      <div>
                        <Label htmlFor="plan">Plan/Tier</Label>
                        <Input
                          id="plan"
                          value={submissionData.metadata.customerPlan}
                          onChange={e => setSubmissionData({
                            ...submissionData,
                            metadata: { ...submissionData.metadata, customerPlan: e.target.value }
                          })}
                          placeholder="Enterprise"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}