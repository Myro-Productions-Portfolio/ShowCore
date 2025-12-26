import { initTRPC, TRPCError } from '@trpc/server'
import { OpenApiMeta } from 'trpc-openapi'
import type { Context } from './context.js'

const t = initTRPC.context<Context>().meta<OpenApiMeta>().create()

export const router = t.router
export const publicProcedure = t.procedure

// Protected procedure - requires authentication
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'You must be logged in' })
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  })
})

// Admin procedure - requires admin role
export const adminProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'You must be logged in' })
  }
  if (ctx.user.role !== 'ADMIN') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' })
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  })
})
