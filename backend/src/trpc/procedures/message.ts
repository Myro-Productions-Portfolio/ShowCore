import { z } from 'zod'
import { router, protectedProcedure } from '../trpc.js'
import { prisma } from '../../db.js'
import { TRPCError } from '@trpc/server'

export const messageRouter = router({
  // List messages for a booking
  list: protectedProcedure
    .input(z.object({
      bookingId: z.string(),
      limit: z.number().min(1).max(100).default(50),
      cursor: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      // Verify user is participant
      const booking = await prisma.booking.findUnique({
        where: { id: input.bookingId },
        include: { technician: true, company: true },
      })

      if (!booking) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' })
      }

      const isParticipant =
        booking.technician.userId === ctx.user.id ||
        booking.company.userId === ctx.user.id

      if (!isParticipant && ctx.user.role !== 'ADMIN') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' })
      }

      const messages = await prisma.message.findMany({
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        where: {
          bookingId: input.bookingId,
          deletedAt: null,
        },
        orderBy: { createdAt: 'desc' },
        include: {
          sender: { select: { id: true, role: true } },
        },
      })

      let nextCursor: string | undefined
      if (messages.length > input.limit) {
        const nextItem = messages.pop()
        nextCursor = nextItem?.id
      }

      return { messages: messages.reverse(), nextCursor }
    }),

  // Send message
  send: protectedProcedure
    .input(z.object({
      bookingId: z.string(),
      content: z.string().min(1).max(5000),
      attachments: z.array(z.string().url()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Verify user is participant
      const booking = await prisma.booking.findUnique({
        where: { id: input.bookingId },
        include: { technician: true, company: true },
      })

      if (!booking) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' })
      }

      const isParticipant =
        booking.technician.userId === ctx.user.id ||
        booking.company.userId === ctx.user.id

      if (!isParticipant) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' })
      }

      return prisma.message.create({
        data: {
          bookingId: input.bookingId,
          senderId: ctx.user.id,
          content: input.content,
          attachments: input.attachments,
        },
        include: {
          sender: { select: { id: true, role: true } },
        },
      })
    }),

  // Mark messages as read
  markRead: protectedProcedure
    .input(z.object({
      bookingId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      return prisma.message.updateMany({
        where: {
          bookingId: input.bookingId,
          senderId: { not: ctx.user.id },
          readAt: null,
        },
        data: { readAt: new Date() },
      })
    }),
})
