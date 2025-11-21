import { ObjectId } from 'mongodb'

export type RoleTag = 'Founder' | 'Employee' | 'Investor' | 'Advisor' | 'Customer' | 'Fan'

export interface UserDoc {
  _id: ObjectId
  authId: string
  name: string
  email: string
  image?: string
  roles?: Array<{
    companyId: ObjectId
    role: RoleTag
    title?: string
    joinedYear?: number
    fundName?: string
    stage?: string
    customerPlan?: string
    startedAt?: string
  }>
  createdAt: Date
}

export interface CompanyDoc {
  _id: ObjectId
  name: string
  slug: string
  logoUrl?: string
  website?: string
  category?: string[]
  stage?: 'Pre-Seed' | 'Seed' | 'A' | 'B' | 'C' | 'Growth'
  createdAt: Date
  publishedAt?: Date
  metrics?: {
    nps?: number
    mrr?: number
    growthRate3m?: number
  }
  trust?: {
    total: number
    byRole: Partial<Record<RoleTag, number>>
  }
  rating?: number
  totalRatings?: number
}

export interface SubmissionDoc {
  _id: ObjectId
  companyId: ObjectId
  authorId: ObjectId
  role: RoleTag
  status: 'draft' | 'published'
  comment: string
  metadata?: {
    title?: string
    joinedYear?: number
    fundName?: string
    stage?: string
    customerPlan?: string
    startedAt?: string
    employeeTitle?: string
  }
  weight: number
  createdAt: Date
  publishedAt?: Date
}

export interface EdgeDoc {
  _id: ObjectId
  companyId: ObjectId
  userId: ObjectId
  role: RoleTag
  weight: number
  createdAt: Date
}

export interface RatingDoc {
  _id: ObjectId
  companyId: ObjectId
  userId: ObjectId
  rating: number
  comment?: string
  role: RoleTag
  createdAt: Date
  updatedAt: Date
}