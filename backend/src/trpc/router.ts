import { router } from './trpc.js'

// Import entity routers
import { userRouter } from './procedures/user.js'
import { technicianRouter } from './procedures/technician.js'
import { companyRouter } from './procedures/company.js'
import { skillRouter } from './procedures/skill.js'
import { bookingRouter } from './procedures/booking.js'
import { messageRouter } from './procedures/message.js'
import { showProofRouter } from './procedures/showProof.js'
import { reviewRouter } from './procedures/review.js'
import { disputeRouter } from './procedures/dispute.js'
import { notificationRouter } from './procedures/notification.js'
import { onboardingRouter } from './procedures/onboarding.js'
import { aiAssistantRouter } from './procedures/aiAssistant.js'

export const appRouter = router({
  user: userRouter,
  technician: technicianRouter,
  company: companyRouter,
  skill: skillRouter,
  booking: bookingRouter,
  message: messageRouter,
  showProof: showProofRouter,
  review: reviewRouter,
  dispute: disputeRouter,
  notification: notificationRouter,
  onboarding: onboardingRouter,
  aiAssistant: aiAssistantRouter,
})

export type AppRouter = typeof appRouter
