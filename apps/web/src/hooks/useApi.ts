import { useState, useCallback } from 'react'

// Types
export interface ApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: any
}

/**
 * Custom hook for API calls with loading and error states
 */
export function useApi<T = any>() {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  })

  const execute = useCallback(async (url: string, options: ApiOptions = {}) => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      // API base URL - configurable via environment variable
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002'
      const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`

      const response = await fetch(fullUrl, {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setState({ data, loading: false, error: null })
      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      setState(prev => ({ ...prev, loading: false, error: errorMessage }))
      throw error
    }
  }, [])

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null })
  }, [])

  return {
    ...state,
    execute,
    reset,
  }
}

/**
 * Hook for specific API endpoints
 */
export function useBookingsApi() {
  const api = useApi()

  const getBookings = useCallback(async (filters?: any) => {
    // TODO: Replace with actual API call
    console.log('Fetching bookings with filters:', filters)
    
    // Mock data for now
    const mockBookings = [
      { id: '1', title: 'Concert Setup', date: '2024-12-25', status: 'confirmed' },
      { id: '2', title: 'Corporate Event', date: '2024-12-28', status: 'pending' },
    ]
    
    return new Promise(resolve => {
      setTimeout(() => resolve(mockBookings), 1000)
    })
  }, [])

  const createBooking = useCallback(async (bookingData: any) => {
    // TODO: Replace with actual API call
    console.log('Creating booking:', bookingData)
    
    return new Promise(resolve => {
      setTimeout(() => resolve({ id: Date.now().toString(), ...bookingData }), 1000)
    })
  }, [])

  const updateBooking = useCallback(async (id: string, updates: any) => {
    // TODO: Replace with actual API call
    console.log('Updating booking:', id, updates)
    
    return new Promise(resolve => {
      setTimeout(() => resolve({ id, ...updates }), 1000)
    })
  }, [])

  const deleteBooking = useCallback(async (id: string) => {
    // TODO: Replace with actual API call
    console.log('Deleting booking:', id)
    
    return new Promise(resolve => {
      setTimeout(() => resolve({ success: true }), 1000)
    })
  }, [])

  return {
    ...api,
    getBookings,
    createBooking,
    updateBooking,
    deleteBooking,
  }
}

/**
 * Hook for technician discovery API
 */
export function useTechniciansApi() {
  const api = useApi()

  const searchTechnicians = useCallback(async (query: string, filters?: any) => {
    // TODO: Replace with actual API call
    console.log('Searching technicians:', query, filters)
    
    // Mock delay and data
    return new Promise(resolve => {
      setTimeout(() => resolve([
        { id: '1', name: 'John Doe', skills: ['Audio Engineering'], rate: 75 },
        { id: '2', name: 'Jane Smith', skills: ['Lighting Design'], rate: 85 },
      ]), 1000)
    })
  }, [])

  const getTechnicianProfile = useCallback(async (id: string) => {
    // TODO: Replace with actual API call
    console.log('Fetching technician profile:', id)
    
    return new Promise(resolve => {
      setTimeout(() => resolve({
        id,
        name: 'John Doe',
        skills: ['Audio Engineering', 'Live Sound'],
        bio: 'Professional audio engineer...',
        rate: 75,
        reviews: [],
      }), 1000)
    })
  }, [])

  return {
    ...api,
    searchTechnicians,
    getTechnicianProfile,
  }
}

/**
 * Hook for reviews and ratings API
 */
export function useReviewsApi() {
  const api = useApi()

  const getReviews = useCallback(async (technicianId?: string) => {
    // TODO: Replace with actual API call
    console.log('Fetching reviews for:', technicianId)
    
    return new Promise(resolve => {
      setTimeout(() => resolve([
        { id: '1', rating: 5, comment: 'Excellent work!', author: 'Client A' },
        { id: '2', rating: 4, comment: 'Very professional', author: 'Client B' },
      ]), 1000)
    })
  }, [])

  const submitReview = useCallback(async (reviewData: any) => {
    // TODO: Replace with actual API call
    console.log('Submitting review:', reviewData)
    
    return new Promise(resolve => {
      setTimeout(() => resolve({ id: Date.now().toString(), ...reviewData }), 1000)
    })
  }, [])

  return {
    ...api,
    getReviews,
    submitReview,
  }
}