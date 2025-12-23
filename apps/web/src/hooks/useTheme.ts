import { useState, useEffect, useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'

export type Theme = 'light' | 'dark' | 'system'
export type FontSize = 'small' | 'medium' | 'large'
export type Language = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ja' | 'zh' | 'ko'

/**
 * Custom hook for managing theme state and system preference detection
 */
export function useTheme() {
  const [storedTheme, setStoredTheme] = useLocalStorage<Theme>('showcore_theme', 'system')
  const [fontSize, setFontSize] = useLocalStorage<FontSize>('showcore_font_size', 'medium')
  const [language, setLanguage] = useLocalStorage<Language>('showcore_language', 'en')
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
    
    // Apply theme to document - Tailwind v4 approach
    const root = document.documentElement
    
    // Debug logging
    console.log('Applying theme:', resolved, 'from stored:', storedTheme, 'system:', systemTheme)
    
    // For Tailwind v4, we need to set both class and data attribute
    root.classList.remove('light', 'dark')
    root.classList.add(resolved)
    
    // Also set data attribute for v4 compatibility
    root.setAttribute('data-theme', resolved)
    
    // Debug: log current classes
    console.log('HTML classes after theme change:', root.className)
    console.log('HTML data-theme:', root.getAttribute('data-theme'))
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', resolved === 'dark' ? '#09090b' : '#ffffff')
    }
  }, [storedTheme, systemTheme])

  // Apply font size to document
  useEffect(() => {
    const root = document.documentElement
    
    // Debug logging
    console.log('Applying font size:', fontSize)
    
    // Remove existing font size classes
    root.classList.remove('text-sm', 'text-base', 'text-lg')
    
    // Apply new font size class
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
    
    // Debug: log current classes
    console.log('HTML classes after font size change:', root.className)
  }, [fontSize])

  // Apply language to document
  useEffect(() => {
    const root = document.documentElement
    
    // Debug logging
    console.log('Applying language:', language)
    
    // Set the lang attribute on the html element
    root.setAttribute('lang', language)
    
    // Set data attribute for potential CSS targeting
    root.setAttribute('data-language', language)
    
    // Debug: log current language
    console.log('HTML lang after language change:', root.getAttribute('lang'))
    console.log('HTML data-language:', root.getAttribute('data-language'))
  }, [language])

  const setTheme = useCallback((theme: Theme) => {
    setStoredTheme(theme)
  }, [setStoredTheme])

  const handleSetLanguage = useCallback((lang: Language) => {
    setLanguage(lang)
    // Also update i18next if available
    if (typeof window !== 'undefined' && (window as any).i18n) {
      (window as any).i18n.changeLanguage(lang)
    }
  }, [setLanguage])

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
    fontSize,
    language,
    setTheme,
    setFontSize,
    setLanguage: handleSetLanguage,
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