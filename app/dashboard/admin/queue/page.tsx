'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SubmissionCard } from '@/components/SubmissionCard'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function AdminQueuePage() {
  const [submissions, setSubmissions] = useState<Array<{
    _id: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    role: any
    status: string
    comment: string
    metadata?: Record<string, unknown>
    author?: { name: string; email: string }
    company?: { name: string; slug: string }
  }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSubmissions()
  }, [])

  const fetchSubmissions = async () => {
    try {
      const res = await fetch('/api/submissions/queue')
      if (res.ok) {
        const data = await res.json()
        setSubmissions(data)
      }
    } catch (error) {
      console.error('Error fetching submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (submissionId: string) => {
    try {
      const res = await fetch(`/api/submissions/${submissionId}/approve`, {
        method: 'PATCH'
      })

      if (res.ok) {
        setSubmissions(submissions.filter(s => s._id !== submissionId))
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to approve submission')
      }
    } catch (error) {
      alert('An error occurred')
    }
  }

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

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Approval Queue</CardTitle>
                <CardDescription>
                  Review and approve pending submissions
                </CardDescription>
              </div>
              <Badge variant="secondary">
                {submissions.length} Pending
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : submissions.length === 0 ? (
              <p className="text-muted-foreground">No pending submissions</p>
            ) : (
              <div className="space-y-4">
                {submissions.map(submission => (
                  <SubmissionCard
                    key={submission._id}
                    submission={submission}
                    showApproveButton
                    onApprove={() => handleApprove(submission._id)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}