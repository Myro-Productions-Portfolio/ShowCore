import { z } from 'zod'
import { router, publicProcedure, protectedProcedure, adminProcedure } from '../trpc.js'
import { prisma } from '../../db.js'
import { TRPCError } from '@trpc/server'

export const showProofRouter = router({
  // List show proofs (public - only approved)
  list: publicProcedure
    .input(z.object({
      technicianId: z.string().optional(),
      limit: z.number().min(1).max(50).default(20),
      cursor: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const showProofs = await prisma.showProof.findMany({
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        where: {
          deletedAt: null,
          status: 'APPROVED',
          technicianId: input.technicianId,
        },
        orderBy: { createdAt: 'desc' },
        include: {
          technician: { select: { displayName: true, avatarUrl: true } },
        },
      })

      let nextCursor: string | undefined
      if (showProofs.length > input.limit) {
        const nextItem = showProofs.pop()
        nextCursor = nextItem?.id
      }

      return { showProofs, nextCursor }
    }),

  // List my show proofs (all statuses)
  myList: protectedProcedure
    .input(z.object({
      status: z.enum(['PENDING', 'AI_REVIEWED', 'APPROVED', 'REJECTED']).optional(),
      limit: z.number().min(1).max(50).default(20),
      cursor: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const technician = await prisma.technician.findUnique({
        where: { userId: ctx.user.id },
      })
      if (!technician) {
        return { showProofs: [], nextCursor: undefined }
      }

      const showProofs = await prisma.showProof.findMany({
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        where: {
          deletedAt: null,
          technicianId: technician.id,
          status: input.status,
        },
        orderBy: { createdAt: 'desc' },
      })

      let nextCursor: string | undefined
      if (showProofs.length > input.limit) {
        const nextItem = showProofs.pop()
        nextCursor = nextItem?.id
      }

      return { showProofs, nextCursor }
    }),

  // Get by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return prisma.showProof.findUnique({
        where: { id: input.id, deletedAt: null },
        include: {
          technician: { select: { displayName: true, avatarUrl: true, userId: true } },
        },
      })
    }),

  // Submit show proof
  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1).max(200),
      description: z.string().max(2000).optional(),
      proofType: z.enum(['PHOTO', 'VIDEO', 'CONSOLE_FILE', 'DOCUMENT', 'PORTFOLIO']),
      mediaUrls: z.array(z.string().url()).min(1).max(10),
    }))
    .mutation(async ({ input, ctx }) => {
      const technician = await prisma.technician.findUnique({
        where: { userId: ctx.user.id },
      })
      if (!technician) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Technician profile required' })
      }

      return prisma.showProof.create({
        data: {
          ...input,
          technicianId: technician.id,
        },
      })
    }),

  // Admin: Review show proof
  review: adminProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(['APPROVED', 'REJECTED']),
      reviewNotes: z.string().max(1000).optional(),
      xpAwarded: z.number().int().min(0).max(1000).default(0),
    }))
    .mutation(async ({ input, ctx }) => {
      const showProof = await prisma.showProof.findUnique({
        where: { id: input.id },
        include: { technician: true },
      })

      if (!showProof) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Show proof not found' })
      }

      // Update show proof and award XP if approved
      const [updated] = await prisma.$transaction([
        prisma.showProof.update({
          where: { id: input.id },
          data: {
            status: input.status,
            reviewedBy: ctx.user.id,
            reviewedAt: new Date(),
            reviewNotes: input.reviewNotes,
            xpAwarded: input.status === 'APPROVED' ? input.xpAwarded : 0,
          },
        }),
        ...(input.status === 'APPROVED' && input.xpAwarded > 0
          ? [
              prisma.technician.update({
                where: { id: showProof.technicianId },
                data: { xpPoints: { increment: input.xpAwarded } },
              }),
            ]
          : []),
      ])

      return updated
    }),

  // Delete show proof
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const showProof = await prisma.showProof.findUnique({
        where: { id: input.id },
        include: { technician: true },
      })

      if (!showProof) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Show proof not found' })
      }

      if (showProof.technician.userId !== ctx.user.id && ctx.user.role !== 'ADMIN') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' })
      }

      return prisma.showProof.update({
        where: { id: input.id },
        data: { deletedAt: new Date() },
      })
    }),
})
