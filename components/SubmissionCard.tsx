'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RoleTag } from '@/lib/models'
import { CheckCircle2, Clock, User } from 'lucide-react'

interface SubmissionCardProps {
  submission: {
    _id: string | { toString(): string }
    role: RoleTag
    status: string
    comment: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata?: any
    author?: { name: string; email: string }
    company?: { name: string; slug: string }
  }
  showApproveButton?: boolean
  onApprove?: () => void
}

export function SubmissionCard({ submission, showApproveButton, onApprove }: SubmissionCardProps) {
  const roleColors = {
    Investor: 'bg-purple-100 text-purple-800',
    Employee: 'bg-blue-100 text-blue-800',
    Founder: 'bg-green-100 text-green-800',
    Customer: 'bg-orange-100 text-orange-800',
    Advisor: 'bg-yellow-100 text-yellow-800',
    Fan: 'bg-gray-100 text-gray-800'
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="w-4 h-4" />
              {submission.author?.name || 'Anonymous'}
            </CardTitle>
            {submission.company && (
              <CardDescription>{submission.company.name}</CardDescription>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className={roleColors[submission.role]}>{submission.role}</Badge>
            <Badge variant={submission.status === 'published' ? 'default' : 'secondary'}>
              {submission.status === 'published' ? (
                <>
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Published
                </>
              ) : (
                <>
                  <Clock className="w-3 h-3 mr-1" />
                  Draft
                </>
              )}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm mb-4">{submission.comment}</p>
        {submission.metadata && (
          <div className="text-xs text-muted-foreground space-y-1">
            {submission.metadata.employeeTitle && (
              <p>Title: {submission.metadata.employeeTitle}</p>
            )}
            {submission.metadata.joinedYear && (
              <p>Joined: {submission.metadata.joinedYear}</p>
            )}
            {submission.metadata.fundName && (
              <p>Fund: {submission.metadata.fundName}</p>
            )}
            {submission.metadata.customerPlan && (
              <p>Plan: {submission.metadata.customerPlan}</p>
            )}
          </div>
        )}
        {showApproveButton && submission.status === 'draft' && (
          <Button onClick={onApprove} className="mt-4 w-full" size="sm">
            Approve & Publish
          </Button>
        )}
      </CardContent>
    </Card>
  )
}