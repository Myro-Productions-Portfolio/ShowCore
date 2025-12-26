import { z } from 'zod'
import { router, publicProcedure, protectedProcedure } from '../trpc.js'
import { prisma } from '../../db.js'
import { TRPCError } from '@trpc/server'

const CompanyCreateInput = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  logoUrl: z.string().url().optional(),
  website: z.string().url().optional(),
  location: z.string().max(200).optional(),
})

const CompanyUpdateInput = CompanyCreateInput.partial()

export const companyRouter = router({
  // List companies (public)
  list: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/api/v1/companies',
        summary: 'List companies',
        tags: ['Companies'],
      },
    })
    .input(z.object({
      limit: z.number().min(1).max(50).default(20),
      cursor: z.string().optional(),
      subscriptionTier: z.enum(['FREE', 'BASIC', 'PRO', 'ENTERPRISE']).optional(),
    }))
    .output(z.any())
    .query(async ({ input }) => {
      const companies = await prisma.company.findMany({
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        where: {
          deletedAt: null,
          subscriptionTier: input.subscriptionTier,
        },
        orderBy: { createdAt: 'desc' },
      })

      let nextCursor: string | undefined
      if (companies.length > input.limit) {
        const nextItem = companies.pop()
        nextCursor = nextItem?.id
      }

      return { companies, nextCursor }
    }),

  // Get company by ID
  getById: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/api/v1/companies/{id}',
        summary: 'Get company by ID',
        tags: ['Companies'],
      },
    })
    .input(z.object({ id: z.string() }))
    .output(z.any())
    .query(async ({ input }) => {
      return prisma.company.findUnique({
        where: { id: input.id, deletedAt: null },
      })
    }),

  // Create company profile
  create: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/api/v1/companies',
        summary: 'Create company profile',
        tags: ['Companies'],
        protect: true,
      },
    })
    .input(CompanyCreateInput)
    .output(z.any())
    .mutation(async ({ input, ctx }) => {
      const existing = await prisma.company.findUnique({
        where: { userId: ctx.user.id },
      })
      if (existing) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Company profile already exists' })
      }

      const [company] = await prisma.$transaction([
        prisma.company.create({
          data: { ...input, userId: ctx.user.id },
        }),
        prisma.user.update({
          where: { id: ctx.user.id },
          data: { role: 'COMPANY' },
        }),
      ])

      return company
    }),

  // Update company profile
  update: protectedProcedure
    .meta({
      openapi: {
        method: 'PATCH',
        path: '/api/v1/companies/me',
        summary: 'Update company profile',
        tags: ['Companies'],
        protect: true,
      },
    })
    .input(CompanyUpdateInput)
    .output(z.any())
    .mutation(async ({ input, ctx }) => {
      const company = await prisma.company.findUnique({
        where: { userId: ctx.user.id },
      })
      if (!company) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Company profile not found' })
      }

      return prisma.company.update({
        where: { id: company.id },
        data: input,
      })
    }),
})
