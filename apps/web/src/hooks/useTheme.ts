import { useState, useEffect, useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'

export type Theme = 'light' | 'dark' | 'system'

/**
 * Custom hook for managing theme state and system preference detection
 */
export function useTheme() {
  const [storedTheme, setStoredTheme] = useLocalStorage<Theme>('showcore_theme', 'system')
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }

    // Set initial system theme
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light')
    
    // Listen for changes
    mediaQuery.addEventListener('change', handleChange)
    
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Update resolved theme when stored theme or system theme changes
  useEffect(() => {
    const resolved = storedTheme === 'system' ? systemTheme : storedTheme
    setResolvedTheme(resolved)
    
    // Apply theme to document
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(resolved)
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', resolved === 'dark' ? '#09090b' : '#ffffff')
    }
  }, [storedTheme, systemTheme])

  const setTheme = useCallback((theme: Theme) => {
    setStoredTheme(theme)
  }, [setStoredTheme])

  const toggleTheme = useCallback(() => {
    if (storedTheme === 'system') {
      setTheme(systemTheme === 'dark' ? 'light' : 'dark')
    } else {
      setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
    }
  }, [storedTheme, systemTheme, resolvedTheme, setTheme])

  return {
    theme: storedTheme,
    resolvedTheme,
    systemTheme,
    setTheme,
    toggleTheme,
  }
}

/**
 * Hook for managing reduced motion preference
 */
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches)
    
    // Listen for changes
    mediaQuery.addEventListener('change', handleChange)
    
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersReducedMotion
}