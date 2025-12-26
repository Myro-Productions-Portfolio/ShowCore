import { z } from 'zod'
import { router, publicProcedure, adminProcedure } from '../trpc.js'
import { prisma } from '../../db.js'

export const skillRouter = router({
  // List all skills
  list: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/api/v1/skills',
        summary: 'List all skills',
        tags: ['Skills'],
      },
    })
    .input(z.object({
      category: z.string().optional(),
    }))
    .output(z.any())
    .query(async ({ input }) => {
      return prisma.skill.findMany({
        where: { category: input.category },
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
      })
    }),

  // Get skill by ID
  getById: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/api/v1/skills/{id}',
        summary: 'Get skill by ID',
        tags: ['Skills'],
      },
    })
    .input(z.object({ id: z.string() }))
    .output(z.any())
    .query(async ({ input }) => {
      return prisma.skill.findUnique({
        where: { id: input.id },
        include: {
          technicians: {
            where: { isVerified: true },
            take: 10,
            include: { technician: { select: { displayName: true, tier: true } } },
          },
        },
      })
    }),

  // Admin: Create skill
  create: adminProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/api/v1/admin/skills',
        summary: 'Create skill (admin only)',
        tags: ['Admin'],
        protect: true,
      },
    })
    .input(z.object({
      name: z.string().min(1).max(100),
      category: z.string().min(1).max(50),
      description: z.string().max(500).optional(),
    }))
    .output(z.any())
    .mutation(async ({ input }) => {
      return prisma.skill.create({ data: input })
    }),

  // Admin: Update skill
  update: adminProcedure
    .meta({
      openapi: {
        method: 'PATCH',
        path: '/api/v1/admin/skills/{id}',
        summary: 'Update skill (admin only)',
        tags: ['Admin'],
        protect: true,
      },
    })
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).max(100).optional(),
      category: z.string().min(1).max(50).optional(),
      description: z.string().max(500).optional(),
    }))
    .output(z.any())
    .mutation(async ({ input }) => {
      const { id, ...data } = input
      return prisma.skill.update({ where: { id }, data })
    }),

  // Admin: Verify technician skill
  verify: adminProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/api/v1/admin/skills/verify',
        summary: 'Verify technician skill (admin only)',
        tags: ['Admin'],
        protect: true,
      },
    })
    .input(z.object({
      technicianId: z.string(),
      skillId: z.string(),
    }))
    .output(z.any())
    .mutation(async ({ input, ctx }) => {
      return prisma.technicianSkill.update({
        where: {
          technicianId_skillId: {
            technicianId: input.technicianId,
            skillId: input.skillId,
          },
        },
        data: {
          isVerified: true,
          verifiedAt: new Date(),
          verifiedBy: ctx.user.id,
        },
      })
    }),
})
