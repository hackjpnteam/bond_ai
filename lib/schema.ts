import { z } from 'zod'

export const roleTagSchema = z.enum(['Founder', 'Employee', 'Investor', 'Advisor', 'Customer', 'Fan'])

export const stageSchema = z.enum(['Pre-Seed', 'Seed', 'A', 'B', 'C', 'Growth'])

export const createCompanySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  website: z.string().url().optional(),
  logoUrl: z.string().url().optional(),
  category: z.array(z.string()).optional(),
  stage: stageSchema.optional()
})

export const createSubmissionSchema = z.object({
  companyId: z.string().min(1),
  role: roleTagSchema,
  comment: z.string().min(10).max(1000),
  metadata: z.object({
    title: z.string().optional(),
    joinedYear: z.number().min(1900).max(2100).optional(),
    fundName: z.string().optional(),
    stage: z.string().optional(),
    customerPlan: z.string().optional(),
    startedAt: z.string().optional(),
    employeeTitle: z.string().optional()
  }).optional()
})

export const approveSubmissionSchema = z.object({
  submissionId: z.string().min(1)
})