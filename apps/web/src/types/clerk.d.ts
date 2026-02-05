// Clerk window type definitions
import type { Clerk } from '@clerk/clerk-js'

declare global {
  interface Window {
    Clerk?: Clerk
  }
}

export {}
