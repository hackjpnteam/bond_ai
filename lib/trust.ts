import { ObjectId } from 'mongodb'
import { getCollection } from './db'
import { RoleTag, SubmissionDoc, CompanyDoc } from './models'

const WEIGHTS: Record<RoleTag, number> = {
  Investor: 5,
  Employee: 4,
  Founder: 3,
  Customer: 3,
  Advisor: 2,
  Fan: 1
}

export async function recomputeCompanyTrust(companyId: ObjectId) {
  const submissions = await getCollection<SubmissionDoc>('submissions')
  const companies = await getCollection<CompanyDoc>('companies')
  
  const subs = await submissions
    .find({ companyId, status: 'published' })
    .toArray()
  
  const byRole: Partial<Record<RoleTag, number>> = {}
  let total = 0
  
  for (const s of subs) {
    const w = WEIGHTS[s.role]
    byRole[s.role] = (byRole[s.role] ?? 0) + w
    total += w
  }
  
  await companies.updateOne(
    { _id: companyId },
    { $set: { trust: { total, byRole } } }
  )
  
  return { total, byRole }
}