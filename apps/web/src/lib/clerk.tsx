import { ClerkProvider } from '@clerk/clerk-react'
import { ReactNode } from 'react'

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!publishableKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY')
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider publishableKey={publishableKey}>
      {children}
    </ClerkProvider>
  )
}
