import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ClerkProvider } from '@clerk/clerk-react'
import { AuthProvider } from './hooks/useAuth'
import { router } from './lib/router'
import { trpc, trpcClient } from './lib/trpc'
import './index.css'

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY')
}

// Create a React Query client with error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: false, // Disable retries to prevent cascading errors
      refetchOnWindowFocus: false,
      // Don't throw errors to error boundaries
      useErrorBoundary: false,
    },
    mutations: {
      retry: false,
      useErrorBoundary: false,
    },
  },
})

// Lazy load i18n to reduce initial bundle size
const initI18n = () => import('./i18n')

/**
 * Safely parse a localStorage value that might be JSON or a plain string
 */
function safeParseLocalStorageValue<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value)
  } catch {
    // If JSON.parse fails, the value might be a plain string (e.g., "en" instead of "\"en\"")
    // Return the raw value as-is if it's a string type, otherwise return fallback
    return value as T
  }
}

// Initialize theme and font size on app start
function initializeAppearance() {
  try {
    // Initialize theme
    const storedTheme = localStorage.getItem('showcore_theme')
    const theme = storedTheme ? safeParseLocalStorageValue<string>(storedTheme, 'system') : 'system'
    
    const getResolvedTheme = () => {
      if (theme === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      }
      return theme
    }
    
    const resolvedTheme = getResolvedTheme()
    const root = document.documentElement
    
    // Apply theme - Tailwind v4 approach
    root.classList.remove('light', 'dark')
    root.classList.add(resolvedTheme)
    root.setAttribute('data-theme', resolvedTheme)
    
    // Initialize font size
    const storedFontSize = localStorage.getItem('showcore_font_size')
    const fontSize = storedFontSize ? safeParseLocalStorageValue<string>(storedFontSize, 'medium') : 'medium'
    
    // Remove existing font size classes
    root.classList.remove('text-sm', 'text-base', 'text-lg')
    
    // Apply font size class
    switch (fontSize) {
      case 'small':
        root.classList.add('text-sm')
        break
      case 'large':
        root.classList.add('text-lg')
        break
      default: // medium
        root.classList.add('text-base')
        break
    }
    
    // Initialize language
    const storedLanguage = localStorage.getItem('showcore_language')
    const language = storedLanguage ? safeParseLocalStorageValue<string>(storedLanguage, 'en') : 'en'
    
    // Set the lang attribute on the html element
    root.setAttribute('lang', language)
    root.setAttribute('data-language', language)
  } catch (error) {
    console.warn('Failed to initialize appearance:', error)
  }
}

// Initialize appearance before React renders
initializeAppearance()

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-900">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-zinc-600 dark:text-zinc-400">Loading ShowCore...</p>
      </div>
    </div>
  )
}

// Initialize i18n lazily
initI18n().catch(console.error)

// Store root instance globally to prevent warnings about calling createRoot() multiple times
declare global {
  interface Window {
    __SHOWCORE_ROOT__?: ReturnType<typeof createRoot>
  }
}

const container = document.getElementById('root')!

// Reuse existing root if available, otherwise create new one
if (!window.__SHOWCORE_ROOT__) {
  window.__SHOWCORE_ROOT__ = createRoot(container)
}

window.__SHOWCORE_ROOT__.render(
  <StrictMode>
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <Suspense fallback={<LoadingFallback />}>
            <AuthProvider>
              <RouterProvider router={router} />
            </AuthProvider>
          </Suspense>
        </QueryClientProvider>
      </trpc.Provider>
    </ClerkProvider>
  </StrictMode>,
)

// Enable HMR
if (import.meta.hot) {
  import.meta.hot.accept()
}
