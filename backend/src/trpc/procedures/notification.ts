import { z } from 'zod'
import { router, protectedProcedure } from '../trpc.js'
import { prisma } from '../../db.js'

export const notificationRouter = router({
  // List my notifications
  list: protectedProcedure
    .input(z.object({
      unreadOnly: z.boolean().default(false),
      limit: z.number().min(1).max(50).default(20),
      cursor: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const notifications = await prisma.notification.findMany({
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        where: {
          userId: ctx.user.id,
          readAt: input.unreadOnly ? null : undefined,
        },
        orderBy: { createdAt: 'desc' },
      })

      let nextCursor: string | undefined
      if (notifications.length > input.limit) {
        const nextItem = notifications.pop()
        nextCursor = nextItem?.id
      }

      return { notifications, nextCursor }
    }),

  // Get unread count
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    return prisma.notification.count({
      where: {
        userId: ctx.user.id,
        readAt: null,
      },
    })
  }),

  // Mark as read
  markRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return prisma.notification.updateMany({
        where: {
          id: input.id,
          userId: ctx.user.id,
        },
        data: { readAt: new Date() },
      })
    }),

  // Mark all as read
  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    return prisma.notification.updateMany({
      where: {
        userId: ctx.user.id,
        readAt: null,
      },
      data: { readAt: new Date() },
    })
  }),
})
