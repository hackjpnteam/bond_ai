import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/db'
import { CompanyDoc } from '@/lib/models'
import { recomputeCompanyTrust } from '@/lib/trust'
import { ObjectId } from 'mongodb'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId: companyIdStr } = await params
    const companyId = new ObjectId(companyIdStr)
    const companies = await getCollection<CompanyDoc>('companies')
    
    const company = await companies.findOne({ _id: companyId })
    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }
    
    const trustScore = await recomputeCompanyTrust(companyId)
    
    return NextResponse.json(trustScore)
  } catch (error) {
    console.error('Error fetching trust score:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trust score' },
      { status: 500 }
    )
  }
}