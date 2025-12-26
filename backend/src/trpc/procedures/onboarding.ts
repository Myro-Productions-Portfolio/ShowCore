import { z } from 'zod'
import { router, publicProcedure, protectedProcedure, adminProcedure } from '../trpc.js'
import { prisma } from '../../db.js'

export const onboardingRouter = router({
  // Get all onboarding tasks (for current user's role)
  getTasks: protectedProcedure.query(async ({ ctx }) => {
    return prisma.onboardingTask.findMany({
      where: {
        OR: [{ forRole: null }, { forRole: ctx.user.role }],
      },
      orderBy: [
        { priority: 'asc' },
        { category: 'asc' },
      ],
    })
  }),

  // Get my progress
  getProgress: protectedProcedure.query(async ({ ctx }) => {
    let progress = await prisma.onboardingProgress.findUnique({
      where: { userId: ctx.user.id },
    })

    if (!progress) {
      progress = await prisma.onboardingProgress.create({
        data: { userId: ctx.user.id },
      })
    }

    return progress
  }),

  // Complete a task
  completeTask: protectedProcedure
    .input(z.object({ taskId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const task = await prisma.onboardingTask.findUnique({
        where: { id: input.taskId },
      })

      if (!task) {
        return null
      }

      // Get or create progress
      let progress = await prisma.onboardingProgress.findUnique({
        where: { userId: ctx.user.id },
      })

      if (!progress) {
        progress = await prisma.onboardingProgress.create({
          data: { userId: ctx.user.id },
        })
      }

      const completedTasks = progress.completedTasks as string[]
      if (completedTasks.includes(input.taskId)) {
        return progress
      }

      // Award XP if technician
      const updates: Promise<unknown>[] = [
        prisma.onboardingProgress.update({
          where: { userId: ctx.user.id },
          data: {
            completedTasks: [...completedTasks, input.taskId],
          },
        }),
      ]

      if (task.xpReward > 0) {
        const technician = await prisma.technician.findUnique({
          where: { userId: ctx.user.id },
        })
        if (technician) {
          updates.push(
            prisma.technician.update({
              where: { id: technician.id },
              data: { xpPoints: { increment: task.xpReward } },
            })
          )
        }
      }

      await prisma.$transaction(updates)

      return prisma.onboardingProgress.findUnique({
        where: { userId: ctx.user.id },
      })
    }),

  // Skip a task
  skipTask: protectedProcedure
    .input(z.object({ taskId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      let progress = await prisma.onboardingProgress.findUnique({
        where: { userId: ctx.user.id },
      })

      if (!progress) {
        progress = await prisma.onboardingProgress.create({
          data: { userId: ctx.user.id },
        })
      }

      const skippedTasks = progress.skippedTasks as string[]
      if (skippedTasks.includes(input.taskId)) {
        return progress
      }

      return prisma.onboardingProgress.update({
        where: { userId: ctx.user.id },
        data: {
          skippedTasks: [...skippedTasks, input.taskId],
        },
      })
    }),

  // Admin: Create onboarding task
  createTask: adminProcedure
    .input(z.object({
      title: z.string().min(1).max(200),
      description: z.string().max(1000).optional(),
      category: z.enum(['PROFILE', 'TRUST', 'PAYMENT', 'ENGAGEMENT']),
      priority: z.enum(['REQUIRED', 'RECOMMENDED', 'OPTIONAL']),
      targetRoute: z.string().optional(),
      xpReward: z.number().int().min(0).max(500).default(0),
      forRole: z.enum(['USER', 'TECHNICIAN', 'COMPANY', 'ADMIN']).optional(),
    }))
    .mutation(async ({ input }) => {
      return prisma.onboardingTask.create({ data: input })
    }),
})
