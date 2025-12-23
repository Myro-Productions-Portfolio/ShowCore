import { useState, useEffect } from 'react'

/**
 * Custom hook for responsive design with media queries
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    
    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches)
    }

    // Set initial value
    setMatches(mediaQuery.matches)
    
    // Listen for changes
    mediaQuery.addEventListener('change', handleChange)
    
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [query])

  return matches
}

/**
 * Hook for common breakpoints
 */
export function useBreakpoints() {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)')
  const isDesktop = useMediaQuery('(min-width: 1025px)')
  const isLarge = useMediaQuery('(min-width: 1280px)')
  const isXLarge = useMediaQuery('(min-width: 1536px)')

  return {
    isMobile,
    isTablet,
    isDesktop,
    isLarge,
    isXLarge,
    // Convenience flags
    isMobileOrTablet: isMobile || isTablet,
    isDesktopOrLarge: isDesktop || isLarge || isXLarge,
  }
}

/**
 * Hook for detecting device orientation
 */
export function useOrientation() {
  const isPortrait = useMediaQuery('(orientation: portrait)')
  const isLandscape = useMediaQuery('(orientation: landscape)')

  return {
    isPortrait,
    isLandscape,
  }
}

/**
 * Hook for detecting touch devices
 */
export function useTouchDevice() {
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  useEffect(() => {
    const checkTouchDevice = () => {
      return (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore
        navigator.msMaxTouchPoints > 0
      )
    }

    setIsTouchDevice(checkTouchDevice())
  }, [])

  return isTouchDevice
}