import { createClerkClient } from '@clerk/clerk-sdk-node'

if (!process.env.CLERK_SECRET_KEY) {
  throw new Error('CLERK_SECRET_KEY is required')
}

export const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
})
