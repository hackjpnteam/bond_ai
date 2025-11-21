import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isAdmin } from '@/lib/auth'
import { getCollection } from '@/lib/db'
import { SubmissionDoc, EdgeDoc } from '@/lib/models'
import { recomputeCompanyTrust } from '@/lib/trust'
import { ObjectId } from 'mongodb'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    if (!isAdmin(session.user.email)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }
    
    const { id } = await params
    const submissionId = new ObjectId(id)
    const submissions = await getCollection<SubmissionDoc>('submissions')
    
    const submission = await submissions.findOne({ _id: submissionId })
    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }
    
    if (submission.status === 'published') {
      return NextResponse.json(
        { error: 'Submission already published' },
        { status: 400 }
      )
    }
    
    await submissions.updateOne(
      { _id: submissionId },
      { 
        $set: { 
          status: 'published',
          publishedAt: new Date()
        } 
      }
    )
    
    const edges = await getCollection<EdgeDoc>('edges')
    const edge: Omit<EdgeDoc, '_id'> = {
      companyId: submission.companyId,
      userId: submission.authorId,
      role: submission.role,
      weight: submission.weight,
      createdAt: new Date()
    }
    await edges.insertOne(edge as EdgeDoc)
    
    const trustScore = await recomputeCompanyTrust(submission.companyId)
    
    return NextResponse.json({
      message: 'Submission approved',
      trustScore
    })
  } catch (error) {
    console.error('Error approving submission:', error)
    return NextResponse.json(
      { error: 'Failed to approve submission' },
      { status: 500 }
    )
  }
}