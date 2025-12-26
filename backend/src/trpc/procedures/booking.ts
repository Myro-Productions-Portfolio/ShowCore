import { z } from 'zod'
import { router, protectedProcedure } from '../trpc.js'
import { prisma } from '../../db.js'
import { TRPCError } from '@trpc/server'

const BookingCreateInput = z.object({
  technicianId: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  eventDate: z.coerce.date(),
  eventEndDate: z.coerce.date().optional(),
  location: z.string().max(500).optional(),
  hourlyRate: z.number().positive(),
  estimatedHours: z.number().positive().optional(),
})

const BookingUpdateInput = z.object({
  id: z.string(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  eventDate: z.coerce.date().optional(),
  eventEndDate: z.coerce.date().optional(),
  location: z.string().max(500).optional(),
})

export const bookingRouter = router({
  // List bookings for current user
  list: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).default(20),
      cursor: z.string().optional(),
      status: z.enum(['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED']).optional(),
    }))
    .query(async ({ input, ctx }) => {
      // Get user's technician or company profile
      const user = await prisma.user.findUnique({
        where: { id: ctx.user.id },
        include: { technician: true, company: true },
      })

      const where = {
        deletedAt: null,
        status: input.status,
        OR: [
          { technician: { userId: ctx.user.id } },
          { company: { userId: ctx.user.id } },
        ],
      }

      const bookings = await prisma.booking.findMany({
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        where,
        orderBy: { eventDate: 'desc' },
        include: {
          technician: { select: { displayName: true, avatarUrl: true } },
          company: { select: { name: true, logoUrl: true } },
        },
      })

      let nextCursor: string | undefined
      if (bookings.length > input.limit) {
        const nextItem = bookings.pop()
        nextCursor = nextItem?.id
      }

      return { bookings, nextCursor }
    }),

  // Get booking by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const booking = await prisma.booking.findUnique({
        where: { id: input.id },
        include: {
          technician: {
            include: { user: { select: { id: true, email: true } } },
          },
          company: {
            include: { user: { select: { id: true, email: true } } },
          },
          messages: {
            orderBy: { createdAt: 'asc' },
            include: { sender: { select: { id: true } } },
          },
          reviews: true,
          dispute: true,
        },
      })

      if (!booking) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' })
      }

      // Check authorization
      const isParticipant =
        booking.technician.userId === ctx.user.id ||
        booking.company.userId === ctx.user.id

      if (!isParticipant && ctx.user.role !== 'ADMIN') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' })
      }

      return booking
    }),

  // Create booking (company only)
  create: protectedProcedure
    .input(BookingCreateInput)
    .mutation(async ({ input, ctx }) => {
      // Get company profile
      const company = await prisma.company.findUnique({
        where: { userId: ctx.user.id },
      })
      if (!company) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Company profile required to create bookings' })
      }

      // Calculate total
      const totalAmount = input.estimatedHours
        ? input.hourlyRate * input.estimatedHours
        : undefined

      return prisma.booking.create({
        data: {
          ...input,
          companyId: company.id,
          totalAmount,
        },
        include: {
          technician: { select: { displayName: true } },
          company: { select: { name: true } },
        },
      })
    }),

  // Update booking
  update: protectedProcedure
    .input(BookingUpdateInput)
    .mutation(async ({ input, ctx }) => {
      const booking = await prisma.booking.findUnique({
        where: { id: input.id },
        include: { company: true },
      })

      if (!booking) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' })
      }

      // Only company can update booking details
      if (booking.company.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Only the company can update booking details' })
      }

      // Can't update if already in progress or completed
      if (['IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(booking.status)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot update booking in this status' })
      }

      const { id, ...data } = input
      return prisma.booking.update({
        where: { id },
        data,
      })
    }),

  // Accept booking (technician only)
  accept: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const booking = await prisma.booking.findUnique({
        where: { id: input.id },
        include: { technician: true },
      })

      if (!booking) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' })
      }

      if (booking.technician.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Only the technician can accept' })
      }

      if (booking.status !== 'PENDING') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Booking is not pending' })
      }

      return prisma.booking.update({
        where: { id: input.id },
        data: { status: 'ACCEPTED' },
      })
    }),

  // Cancel booking
  cancel: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const booking = await prisma.booking.findUnique({
        where: { id: input.id },
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

      if (['COMPLETED', 'CANCELLED'].includes(booking.status)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot cancel booking in this status' })
      }

      return prisma.booking.update({
        where: { id: input.id },
        data: { status: 'CANCELLED' },
      })
    }),

  // Mark as complete
  complete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const booking = await prisma.booking.findUnique({
        where: { id: input.id },
        include: { company: true },
      })

      if (!booking) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' })
      }

      // Only company can mark as complete
      if (booking.company.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Only the company can mark as complete' })
      }

      if (booking.status !== 'ACCEPTED' && booking.status !== 'IN_PROGRESS') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Booking must be accepted or in progress' })
      }

      return prisma.booking.update({
        where: { id: input.id },
        data: { status: 'COMPLETED' },
      })
    }),
})
