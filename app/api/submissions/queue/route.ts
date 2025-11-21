import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isAdmin } from '@/lib/auth-options'
import { getCollection } from '@/lib/db'
import { SubmissionDoc, UserDoc, CompanyDoc } from '@/lib/models'

export async function GET() {
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
    
    const submissions = await getCollection<SubmissionDoc>('submissions')
    const users = await getCollection<UserDoc>('users')
    const companies = await getCollection<CompanyDoc>('companies')
    
    const draftSubmissions = await submissions
      .find({ status: 'draft' })
      .sort({ createdAt: -1 })
      .toArray()
    
    const enriched = await Promise.all(
      draftSubmissions.map(async (submission) => {
        const author = await users.findOne({ _id: submission.authorId })
        const company = await companies.findOne({ _id: submission.companyId })
        
        return {
          ...submission,
          _id: submission._id.toString(),
          author: author ? { name: author.name, email: author.email } : null,
          company: company ? { name: company.name, slug: company.slug } : null
        }
      })
    )
    
    return NextResponse.json(enriched)
  } catch (error) {
    console.error('Error fetching queue:', error)
    return NextResponse.json(
      { error: 'Failed to fetch queue' },
      { status: 500 }
    )
  }
}