import type { MiddlewareHandler } from 'hono'
import { clerkClient } from '../lib/clerk.js'
import { prisma } from '../db.js'

/**
 * Clerk Authentication Middleware
 * 
 * Extracts the Clerk session token from the Authorization header,
 * verifies it, and attaches the user to the context.
 */
export const clerkAuthMiddleware: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No token provided - continue without user
    await next()
    return
  }

  const token = authHeader.replace('Bearer ', '')

  try {
    // Verify the session token with Clerk
    const session = await clerkClient.sessions.verifySession(token, token)
    
    if (!session || !session.userId) {
      await next()
      return
    }

    // Get Clerk user details
    const clerkUser = await clerkClient.users.getUser(session.userId)
    
    if (!clerkUser) {
      await next()
      return
    }

    // Find or create user in our database
    const email = clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress
    
    if (!email) {
      await next()
      return
    }

    let user = await prisma.user.findUnique({
      where: { email },
      include: {
        technician: true,
        company: true,
      },
    })

    // Create user if doesn't exist
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          emailVerified: true,
          role: 'USER',
        },
        include: {
          technician: true,
          company: true,
        },
      })
    }

    // Attach user to context
    c.set('user', user)
    c.set('clerkUser', clerkUser)
  } catch (error) {
    console.error('Clerk auth error:', error)
    // Continue without user on error
  }

  await next()
}

/**
 * Require authentication middleware
 * Use this to protect routes that require a logged-in user
 */
export const requireAuth: MiddlewareHandler = async (c, next) => {
  const user = c.get('user')
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  await next()
}

/**
 * Require admin role middleware
 * Use this to protect admin-only routes
 */
export const requireAdmin: MiddlewareHandler = async (c, next) => {
  const user = c.get('user')
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  if (user.role !== 'ADMIN') {
    return c.json({ error: 'Forbidden - Admin access required' }, 403)
  }
  await next()
}
