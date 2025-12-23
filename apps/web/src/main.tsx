import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { router } from './lib/router'
import './i18n' // Initialize i18n
import './index.css'

// Initialize theme and font size on app start
function initializeAppearance() {
  // Initialize theme
  const storedTheme = localStorage.getItem('showcore_theme')
  const theme = storedTheme ? JSON.parse(storedTheme) : 'system'
  
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
  
  console.log('Initial theme setup:', resolvedTheme)
  
  // Initialize font size
  const storedFontSize = localStorage.getItem('showcore_font_size')
  const fontSize = storedFontSize ? JSON.parse(storedFontSize) : 'medium'
  
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
  
  console.log('Initial font size setup:', fontSize)
  
  // Initialize language
  const storedLanguage = localStorage.getItem('showcore_language')
  const language = storedLanguage ? JSON.parse(storedLanguage) : 'en'
  
  // Set the lang attribute on the html element
  root.setAttribute('lang', language)
  root.setAttribute('data-language', language)
  
  console.log('Initial language setup:', language)
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<LoadingFallback />}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </Suspense>
  </StrictMode>,
)
