import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Custom hook that debounces a value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Custom hook that debounces a callback function
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const callbackRef = useRef(callback)
  const timeoutRef = useRef<NodeJS.Timeout>()

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args)
      }, delay)
    },
    [delay]
  ) as T

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return debouncedCallback
}

/**
 * Hook for debounced search functionality
 */
export function useDebouncedSearch(
  searchFunction: (query: string) => Promise<any>,
  delay = 300
) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const debouncedQuery = useDebounce(query, delay)

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([])
      setError(null)
      return
    }

    const performSearch = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const searchResults = await searchFunction(debouncedQuery)
        setResults(searchResults)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed')
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }

    performSearch()
  }, [debouncedQuery, searchFunction])

  const clearSearch = useCallback(() => {
    setQuery('')
    setResults([])
    setError(null)
  }, [])

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    clearSearch,
  }
}