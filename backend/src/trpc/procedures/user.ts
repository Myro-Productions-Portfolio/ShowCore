import { z } from 'zod'
import { router, publicProcedure, protectedProcedure, adminProcedure } from '../trpc.js'
import { prisma } from '../../db.js'

export const userRouter = router({
  // Get current user
  me: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/api/v1/users/me',
        summary: 'Get current authenticated user',
        tags: ['Users'],
        protect: true,
      },
    })
    .input(z.void())
    .output(z.any())
    .query(async ({ ctx }) => {
      return prisma.user.findUnique({
        where: { id: ctx.user.id },
        include: {
          technician: true,
          company: true,
        },
      })
    }),

  // Get user by ID (public profiles)
  getById: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/api/v1/users/{id}',
        summary: 'Get user by ID',
        tags: ['Users'],
      },
    })
    .input(z.object({ id: z.string() }))
    .output(z.any())
    .query(async ({ input }) => {
      return prisma.user.findUnique({
        where: { id: input.id, deletedAt: null },
        select: {
          id: true,
          role: true,
          createdAt: true,
          technician: {
            select: {
              displayName: true,
              bio: true,
              avatarUrl: true,
              location: true,
              tier: true,
              isVerified: true,
            },
          },
          company: {
            select: {
              name: true,
              description: true,
              logoUrl: true,
              website: true,
            },
          },
        },
      })
    }),

  // Update current user
  update: protectedProcedure
    .meta({
      openapi: {
        method: 'PATCH',
        path: '/api/v1/users/me',
        summary: 'Update current user',
        tags: ['Users'],
        protect: true,
      },
    })
    .input(z.object({
      email: z.string().email().optional(),
    }))
    .output(z.any())
    .mutation(async ({ input, ctx }) => {
      return prisma.user.update({
        where: { id: ctx.user.id },
        data: input,
      })
    }),

  // Admin: List all users
  adminList: adminProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/api/v1/admin/users',
        summary: 'List all users (admin only)',
        tags: ['Admin'],
        protect: true,
      },
    })
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      cursor: z.string().optional(),
      role: z.enum(['USER', 'TECHNICIAN', 'COMPANY', 'ADMIN']).optional(),
    }))
    .output(z.any())
    .query(async ({ input }) => {
      const users = await prisma.user.findMany({
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        where: {
          deletedAt: null,
          role: input.role,
        },
        orderBy: { createdAt: 'desc' },
        include: {
          technician: { select: { displayName: true } },
          company: { select: { name: true } },
        },
      })

      let nextCursor: string | undefined
      if (users.length > input.limit) {
        const nextItem = users.pop()
        nextCursor = nextItem?.id
      }

      return { users, nextCursor }
    }),

  // Soft delete (admin only)
  delete: adminProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/api/v1/admin/users/{id}',
        summary: 'Delete user (admin only)',
        tags: ['Admin'],
        protect: true,
      },
    })
    .input(z.object({ id: z.string() }))
    .output(z.any())
    .mutation(async ({ input }) => {
      return prisma.user.update({
        where: { id: input.id },
        data: { deletedAt: new Date() },
      })
    }),
})
