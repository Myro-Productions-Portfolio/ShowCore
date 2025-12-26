import { z } from 'zod'
import { router, protectedProcedure } from '../trpc.js'
import { prisma } from '../../db.js'

export const aiAssistantRouter = router({
  // Get or create conversation
  getConversation: protectedProcedure
    .input(z.object({
      context: z.object({
        currentPage: z.string(),
        userRole: z.string(),
        onboardingComplete: z.boolean(),
      }).optional(),
    }))
    .query(async ({ input, ctx }) => {
      // Get most recent conversation or create new one
      let conversation = await prisma.aIAssistantConversation.findFirst({
        where: { userId: ctx.user.id },
        orderBy: { updatedAt: 'desc' },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 50,
          },
        },
      })

      if (!conversation) {
        conversation = await prisma.aIAssistantConversation.create({
          data: {
            userId: ctx.user.id,
            context: input.context || {},
          },
          include: { messages: true },
        })
      } else if (input.context) {
        // Update context
        conversation = await prisma.aIAssistantConversation.update({
          where: { id: conversation.id },
          data: { context: input.context },
          include: {
            messages: {
              orderBy: { createdAt: 'asc' },
              take: 50,
            },
          },
        })
      }

      return conversation
    }),

  // Send message
  sendMessage: protectedProcedure
    .input(z.object({
      conversationId: z.string(),
      content: z.string().min(1).max(2000),
    }))
    .mutation(async ({ input, ctx }) => {
      // Verify conversation belongs to user
      const conversation = await prisma.aIAssistantConversation.findUnique({
        where: { id: input.conversationId },
      })

      if (!conversation || conversation.userId !== ctx.user.id) {
        throw new Error('Conversation not found')
      }

      // Create user message
      const userMessage = await prisma.aIAssistantMessage.create({
        data: {
          conversationId: input.conversationId,
          sender: 'USER',
          content: input.content,
        },
      })

      // TODO: Call AI service to generate response
      // For now, create a placeholder response
      const assistantMessage = await prisma.aIAssistantMessage.create({
        data: {
          conversationId: input.conversationId,
          sender: 'ASSISTANT',
          content: 'I understand your question. Let me help you with that.',
          suggestedActions: [],
        },
      })

      // Update conversation timestamp
      await prisma.aIAssistantConversation.update({
        where: { id: input.conversationId },
        data: { updatedAt: new Date() },
      })

      return { userMessage, assistantMessage }
    }),

  // Clear conversation history
  clearHistory: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const conversation = await prisma.aIAssistantConversation.findUnique({
        where: { id: input.conversationId },
      })

      if (!conversation || conversation.userId !== ctx.user.id) {
        throw new Error('Conversation not found')
      }

      await prisma.aIAssistantMessage.deleteMany({
        where: { conversationId: input.conversationId },
      })

      return { success: true }
    }),
})
