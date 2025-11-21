import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/db'
import { EdgeDoc, UserDoc, CompanyDoc } from '@/lib/models'
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
    
    const edges = await getCollection<EdgeDoc>('edges')
    const edgeList = await edges.find({ companyId }).toArray()
    
    const userIds = [...new Set(edgeList.map(e => e.userId))]
    const users = await getCollection<UserDoc>('users')
    const userList = await users.find({ _id: { $in: userIds } }).toArray()
    
    const nodes = [
      {
        id: company._id.toString(),
        type: 'company',
        label: company.name,
        size: 30
      },
      ...userList.map(user => ({
        id: user._id.toString(),
        type: 'user',
        label: user.name,
        role: edgeList.find(e => e.userId.equals(user._id))?.role,
        size: edgeList.find(e => e.userId.equals(user._id))?.weight || 1 * 5
      }))
    ]
    
    const links = edgeList.map(edge => ({
      source: edge.userId.toString(),
      target: edge.companyId.toString(),
      role: edge.role,
      weight: edge.weight
    }))
    
    return NextResponse.json({ nodes, links })
  } catch (error) {
    console.error('Error fetching graph data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch graph data' },
      { status: 500 }
    )
  }
}