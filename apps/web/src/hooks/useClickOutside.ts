import { useEffect, useRef, RefObject } from 'react'

/**
 * Custom hook that triggers a callback when clicking outside of the referenced element
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  callback: () => void,
  enabled = true
): RefObject<T> {
  const ref = useRef<T>(null)

  useEffect(() => {
    if (!enabled) return

    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [callback, enabled])

  return ref
}

/**
 * Hook for handling escape key press
 */
export function useEscapeKey(callback: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        callback()
      }
    }

    document.addEventListener('keydown', handleEscapeKey)
    
    return () => {
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [callback, enabled])
}

/**
 * Combined hook for modal/dropdown behavior (click outside + escape key)
 */
export function useModalBehavior<T extends HTMLElement = HTMLElement>(
  onClose: () => void,
  enabled = true
) {
  const ref = useClickOutside<T>(onClose, enabled)
  useEscapeKey(onClose, enabled)
  
  return ref
}