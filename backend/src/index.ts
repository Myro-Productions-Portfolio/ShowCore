import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { trpcServer } from '@hono/trpc-server'
import { serve } from '@hono/node-server'
import { appRouter } from './trpc/router.js'
import { createContext } from './trpc/context.js'

const app = new Hono()

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100 // 100 requests per minute

// Rate limiting middleware
app.use('*', async (c, next) => {
  const ip = c.req.header('x-forwarded-for')?.split(',')[0] || c.req.header('x-real-ip') || 'unknown'
  const now = Date.now()

  let record = rateLimitStore.get(ip)

  if (!record || now > record.resetTime) {
    record = { count: 1, resetTime: now + RATE_LIMIT_WINDOW }
    rateLimitStore.set(ip, record)
  } else {
    record.count++
    if (record.count > RATE_LIMIT_MAX_REQUESTS) {
      return c.json({ error: 'Too Many Requests' }, 429)
    }
  }

  // Cleanup old entries every 5 minutes
  if (Math.random() < 0.01) {
    for (const [key, value] of rateLimitStore.entries()) {
      if (now > value.resetTime) {
        rateLimitStore.delete(key)
      }
    }
  }

  await next()
})

// Middleware
app.use('*', logger())
app.use('/*', cors({
  origin: (origin) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost:3010',
      'http://localhost:5173',
      'http://192.168.1.121:3003',
      'http://100.85.249.61:3003',
      'https://showcore.myroproductions.com',
      'https://showcore-app.vercel.app',
    ]
    // SECURITY: Removed wildcard *.vercel.app - only allow specific Vercel URL
    if (origin && allowedOrigins.includes(origin)) {
      return origin
    }
    return allowedOrigins[0]
  },
  credentials: true,
}))

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

// tRPC handler
app.use('/trpc/*', trpcServer({
  router: appRouter,
  createContext,
}))

// 404 handler
app.notFound((c) => c.json({ error: 'Not Found' }, 404))

// Error handler
app.onError((err, c) => {
  console.error('Server error:', err)
  return c.json({ error: 'Internal Server Error' }, 500)
})

// Start local server for development
const port = parseInt(process.env.PORT || '3001', 10)
console.log(`Server starting on http://localhost:${port}`)
serve({
  fetch: app.fetch,
  port,
})

// Export for Vercel Functions
export default app
