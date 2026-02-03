import { createTRPCReact } from '@trpc/react-query'
import { httpBatchLink } from '@trpc/client'

// Import the AppRouter type from the backend
// Note: In a real monorepo setup, you'd export this type from a shared package
// For now, we define the type inline based on backend router structure
type AppRouter = {
  user: any
  technician: any
  company: any
  skill: any
  booking: any
  message: any
  showProof: any
  review: any
  dispute: any
  notification: any
  onboarding: any
  aiAssistant: any
}

// Create the tRPC React hooks
export const trpc = createTRPCReact<AppRouter>()

// Get the API URL from environment or use local default
const getBaseUrl = () => {
  // Use environment variable if available
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  // Local development default
  return 'http://localhost:3002'
}

// Create tRPC client with links
export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/trpc`,
      // Include credentials for cookies/auth
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: 'include',
        })
      },
    }),
  ],
})

// Export types for use in components
export type { AppRouter }
