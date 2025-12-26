import { z } from 'zod'
import { router, protectedProcedure, adminProcedure } from '../trpc.js'
import { prisma } from '../../db.js'
import { TRPCError } from '@trpc/server'

export const disputeRouter = router({
  // List my disputes
  myList: protectedProcedure
    .input(z.object({
      status: z.enum(['OPEN', 'UNDER_REVIEW', 'ARBITRATION', 'RESOLVED', 'DISMISSED']).optional(),
      limit: z.number().min(1).max(50).default(20),
      cursor: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const disputes = await prisma.dispute.findMany({
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        where: {
          OR: [{ filerId: ctx.user.id }, { respondentId: ctx.user.id }],
          status: input.status,
        },
        orderBy: { createdAt: 'desc' },
        include: {
          booking: { select: { title: true } },
          filer: { select: { id: true } },
          respondent: { select: { id: true } },
        },
      })

      let nextCursor: string | undefined
      if (disputes.length > input.limit) {
        const nextItem = disputes.pop()
        nextCursor = nextItem?.id
      }

      return { disputes, nextCursor }
    }),

  // Get dispute by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const dispute = await prisma.dispute.findUnique({
        where: { id: input.id },
        include: {
          booking: {
            include: {
              technician: { select: { displayName: true } },
              company: { select: { name: true } },
            },
          },
          filer: {
            select: {
              id: true,
              technician: { select: { displayName: true } },
              company: { select: { name: true } },
            },
          },
          respondent: {
            select: {
              id: true,
              technician: { select: { displayName: true } },
              company: { select: { name: true } },
            },
          },
        },
      })

      if (!dispute) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Dispute not found' })
      }

      const isParticipant =
        dispute.filerId === ctx.user.id || dispute.respondentId === ctx.user.id

      if (!isParticipant && ctx.user.role !== 'ADMIN') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' })
      }

      return dispute
    }),

  // File a dispute
  create: protectedProcedure
    .input(z.object({
      bookingId: z.string(),
      reason: z.string().min(1).max(200),
      description: z.string().min(10).max(5000),
      evidence: z.array(z.string().url()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const booking = await prisma.booking.findUnique({
        where: { id: input.bookingId },
        include: { technician: true, company: true, dispute: true },
      })

      if (!booking) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' })
      }

      if (booking.dispute) {
        throw new TRPCError({ code: 'CONFLICT', message: 'A dispute already exists for this booking' })
      }

      // Determine respondent
      let respondentId: string
      if (booking.technician.userId === ctx.user.id) {
        respondentId = booking.company.userId
      } else if (booking.company.userId === ctx.user.id) {
        respondentId = booking.technician.userId
      } else {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You are not a participant in this booking' })
      }

      // Create dispute and update booking status
      const [dispute] = await prisma.$transaction([
        prisma.dispute.create({
          data: {
            bookingId: input.bookingId,
            filerId: ctx.user.id,
            respondentId,
            reason: input.reason,
            description: input.description,
            evidence: input.evidence,
          },
        }),
        prisma.booking.update({
          where: { id: input.bookingId },
          data: { status: 'DISPUTED' },
        }),
      ])

      return dispute
    }),

  // Admin: List all disputes
  adminList: adminProcedure
    .input(z.object({
      status: z.enum(['OPEN', 'UNDER_REVIEW', 'ARBITRATION', 'RESOLVED', 'DISMISSED']).optional(),
      limit: z.number().min(1).max(50).default(20),
      cursor: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const disputes = await prisma.dispute.findMany({
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        where: { status: input.status },
        orderBy: { createdAt: 'desc' },
        include: {
          booking: { select: { title: true } },
          filer: {
            select: {
              technician: { select: { displayName: true } },
              company: { select: { name: true } },
            },
          },
        },
      })

      let nextCursor: string | undefined
      if (disputes.length > input.limit) {
        const nextItem = disputes.pop()
        nextCursor = nextItem?.id
      }

      return { disputes, nextCursor }
    }),

  // Admin: Update dispute status
  updateStatus: adminProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(['UNDER_REVIEW', 'ARBITRATION', 'RESOLVED', 'DISMISSED']),
      resolution: z.string().max(2000).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const isResolved = input.status === 'RESOLVED' || input.status === 'DISMISSED'

      return prisma.dispute.update({
        where: { id: input.id },
        data: {
          status: input.status,
          resolution: input.resolution,
          resolvedBy: isResolved ? ctx.user.id : undefined,
          resolvedAt: isResolved ? new Date() : undefined,
        },
      })
    }),
})
