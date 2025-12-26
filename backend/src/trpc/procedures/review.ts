import { z } from 'zod'
import { router, publicProcedure, protectedProcedure } from '../trpc.js'
import { prisma } from '../../db.js'
import { TRPCError } from '@trpc/server'

export const reviewRouter = router({
  // List reviews for a user
  listForUser: publicProcedure
    .input(z.object({
      userId: z.string(),
      limit: z.number().min(1).max(50).default(20),
      cursor: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const reviews = await prisma.review.findMany({
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        where: {
          subjectId: input.userId,
          deletedAt: null,
        },
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              technician: { select: { displayName: true } },
              company: { select: { name: true } },
            },
          },
          booking: { select: { title: true } },
        },
      })

      let nextCursor: string | undefined
      if (reviews.length > input.limit) {
        const nextItem = reviews.pop()
        nextCursor = nextItem?.id
      }

      return { reviews, nextCursor }
    }),

  // Get review stats for a user
  stats: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const reviews = await prisma.review.findMany({
        where: { subjectId: input.userId, deletedAt: null },
        select: { rating: true },
      })

      if (reviews.length === 0) {
        return { average: 0, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } }
      }

      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      let total = 0

      for (const review of reviews) {
        total += review.rating
        distribution[review.rating as keyof typeof distribution]++
      }

      return {
        average: total / reviews.length,
        count: reviews.length,
        distribution,
      }
    }),

  // Create review for a booking
  create: protectedProcedure
    .input(z.object({
      bookingId: z.string(),
      rating: z.number().int().min(1).max(5),
      content: z.string().max(2000).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const booking = await prisma.booking.findUnique({
        where: { id: input.bookingId },
        include: { technician: true, company: true },
      })

      if (!booking) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' })
      }

      if (booking.status !== 'COMPLETED') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Booking must be completed to leave a review' })
      }

      // Determine subject (who is being reviewed)
      let subjectId: string
      if (booking.technician.userId === ctx.user.id) {
        subjectId = booking.company.userId
      } else if (booking.company.userId === ctx.user.id) {
        subjectId = booking.technician.userId
      } else {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You are not a participant in this booking' })
      }

      // Check if already reviewed
      const existing = await prisma.review.findUnique({
        where: {
          bookingId_authorId: {
            bookingId: input.bookingId,
            authorId: ctx.user.id,
          },
        },
      })

      if (existing) {
        throw new TRPCError({ code: 'CONFLICT', message: 'You have already reviewed this booking' })
      }

      return prisma.review.create({
        data: {
          bookingId: input.bookingId,
          authorId: ctx.user.id,
          subjectId,
          rating: input.rating,
          content: input.content,
        },
      })
    }),

  // Respond to a review
  respond: protectedProcedure
    .input(z.object({
      id: z.string(),
      response: z.string().min(1).max(2000),
    }))
    .mutation(async ({ input, ctx }) => {
      const review = await prisma.review.findUnique({
        where: { id: input.id },
      })

      if (!review) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Review not found' })
      }

      if (review.subjectId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You can only respond to reviews about you' })
      }

      if (review.response) {
        throw new TRPCError({ code: 'CONFLICT', message: 'You have already responded to this review' })
      }

      return prisma.review.update({
        where: { id: input.id },
        data: {
          response: input.response,
          respondedAt: new Date(),
        },
      })
    }),
})
