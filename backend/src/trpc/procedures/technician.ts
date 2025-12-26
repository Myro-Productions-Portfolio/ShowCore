import { z } from 'zod'
import { router, publicProcedure, protectedProcedure } from '../trpc.js'
import { prisma } from '../../db.js'
import { TRPCError } from '@trpc/server'

const TechnicianCreateInput = z.object({
  displayName: z.string().min(1).max(100),
  bio: z.string().max(1000).optional(),
  avatarUrl: z.string().url().optional(),
  location: z.string().max(200).optional(),
  hourlyRate: z.number().positive().optional(),
})

const TechnicianUpdateInput = TechnicianCreateInput.partial()

export const technicianRouter = router({
  // List technicians (public discovery)
  list: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/api/v1/technicians',
        summary: 'List technicians',
        tags: ['Technicians'],
      },
    })
    .input(z.object({
      limit: z.number().min(1).max(50).default(20),
      cursor: z.string().optional(),
      tier: z.enum(['BEGINNER', 'EXPERIENCED', 'ADVANCED', 'PRO']).optional(),
      location: z.string().optional(),
      skillId: z.string().optional(),
      minRate: z.number().optional(),
      maxRate: z.number().optional(),
    }))
    .output(z.any())
    .query(async ({ input }) => {
      const technicians = await prisma.technician.findMany({
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        where: {
          deletedAt: null,
          tier: input.tier,
          location: input.location ? { contains: input.location, mode: 'insensitive' } : undefined,
          hourlyRate: {
            gte: input.minRate,
            lte: input.maxRate,
          },
          skills: input.skillId ? { some: { skillId: input.skillId } } : undefined,
        },
        orderBy: [
          { tier: 'desc' },
          { xpPoints: 'desc' },
        ],
        include: {
          user: { select: { id: true } },
          skills: {
            include: { skill: true },
            where: { isVerified: true },
          },
        },
      })

      let nextCursor: string | undefined
      if (technicians.length > input.limit) {
        const nextItem = technicians.pop()
        nextCursor = nextItem?.id
      }

      return { technicians, nextCursor }
    }),

  // Get technician by ID
  getById: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/api/v1/technicians/{id}',
        summary: 'Get technician by ID',
        tags: ['Technicians'],
      },
    })
    .input(z.object({ id: z.string() }))
    .output(z.any())
    .query(async ({ input }) => {
      return prisma.technician.findUnique({
        where: { id: input.id, deletedAt: null },
        include: {
          user: { select: { id: true, email: true } },
          skills: {
            include: { skill: true },
          },
          showProofs: {
            where: { status: 'APPROVED' },
            take: 10,
            orderBy: { createdAt: 'desc' },
          },
        },
      })
    }),

  // Create technician profile (for current user)
  create: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/api/v1/technicians',
        summary: 'Create technician profile',
        tags: ['Technicians'],
        protect: true,
      },
    })
    .input(TechnicianCreateInput)
    .output(z.any())
    .mutation(async ({ input, ctx }) => {
      // Check if user already has a profile
      const existing = await prisma.technician.findUnique({
        where: { userId: ctx.user.id },
      })
      if (existing) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Technician profile already exists' })
      }

      // Create profile and update user role
      const [technician] = await prisma.$transaction([
        prisma.technician.create({
          data: {
            ...input,
            userId: ctx.user.id,
          },
        }),
        prisma.user.update({
          where: { id: ctx.user.id },
          data: { role: 'TECHNICIAN' },
        }),
      ])

      return technician
    }),

  // Update technician profile
  update: protectedProcedure
    .meta({
      openapi: {
        method: 'PATCH',
        path: '/api/v1/technicians/me',
        summary: 'Update technician profile',
        tags: ['Technicians'],
        protect: true,
      },
    })
    .input(TechnicianUpdateInput)
    .output(z.any())
    .mutation(async ({ input, ctx }) => {
      const technician = await prisma.technician.findUnique({
        where: { userId: ctx.user.id },
      })
      if (!technician) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Technician profile not found' })
      }

      return prisma.technician.update({
        where: { id: technician.id },
        data: input,
      })
    }),

  // Add skill to profile
  addSkill: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/api/v1/technicians/me/skills',
        summary: 'Add skill to technician profile',
        tags: ['Technicians'],
        protect: true,
      },
    })
    .input(z.object({ skillId: z.string() }))
    .output(z.any())
    .mutation(async ({ input, ctx }) => {
      const technician = await prisma.technician.findUnique({
        where: { userId: ctx.user.id },
      })
      if (!technician) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Technician profile not found' })
      }

      return prisma.technicianSkill.create({
        data: {
          technicianId: technician.id,
          skillId: input.skillId,
        },
        include: { skill: true },
      })
    }),

  // Remove skill from profile
  removeSkill: protectedProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/api/v1/technicians/me/skills/{skillId}',
        summary: 'Remove skill from technician profile',
        tags: ['Technicians'],
        protect: true,
      },
    })
    .input(z.object({ skillId: z.string() }))
    .output(z.any())
    .mutation(async ({ input, ctx }) => {
      const technician = await prisma.technician.findUnique({
        where: { userId: ctx.user.id },
      })
      if (!technician) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Technician profile not found' })
      }

      return prisma.technicianSkill.delete({
        where: {
          technicianId_skillId: {
            technicianId: technician.id,
            skillId: input.skillId,
          },
        },
      })
    }),
})
