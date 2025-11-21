import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { getCollection } from '@/lib/db'
import { SubmissionDoc, UserDoc } from '@/lib/models'
import { createSubmissionSchema } from '@/lib/schema'
import { ObjectId } from 'mongodb'

const WEIGHTS = {
  Investor: 5,
  Employee: 4,
  Founder: 3,
  Customer: 3,
  Advisor: 2,
  Fan: 1
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const validation = createSubmissionSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      )
    }
    
    const users = await getCollection<UserDoc>('users')
    const user = await users.findOne({ email: session.user.email })
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    const submissions = await getCollection<SubmissionDoc>('submissions')
    
    const submission: Omit<SubmissionDoc, '_id'> = {
      companyId: new ObjectId(validation.data.companyId),
      authorId: user._id,
      role: validation.data.role,
      status: 'draft',
      comment: validation.data.comment,
      metadata: validation.data.metadata,
      weight: WEIGHTS[validation.data.role],
      createdAt: new Date()
    }
    
    const result = await submissions.insertOne(submission as SubmissionDoc)
    
    return NextResponse.json({
      _id: result.insertedId,
      ...submission
    })
  } catch (error) {
    console.error('Error creating submission:', error)
    return NextResponse.json(
      { error: 'Failed to create submission' },
      { status: 500 }
    )
  }
}