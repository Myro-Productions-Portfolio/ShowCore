import { useState, useCallback, useEffect } from 'react'
import { useAuth } from './useAuth'
import { useNotifications } from './useNotifications'

// Types
export interface Booking {
  id: string
  title: string
  description: string
  date: string
  startTime: string
  endTime: string
  location: string
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  technicianId?: string
  companyId: string
  rate: number
  totalAmount: number
  skills: string[]
  equipment?: string[]
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface BookingFilters {
  status?: string[]
  dateRange?: {
    start: string
    end: string
  }
  skills?: string[]
  location?: string
  rateRange?: {
    min: number
    max: number
  }
}

/**
 * Hook for managing bookings
 */
export function useBookings() {
  const { user } = useAuth()
  const { showSuccess, showError } = useNotifications()
  
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch bookings
  const fetchBookings = useCallback(async (filters?: BookingFilters) => {
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      // TODO: Replace with actual API call
      console.log('Fetching bookings for user:', user.id, 'with filters:', filters)
      
      // Mock data based on user role
      const mockBookings: Booking[] = user.role === 'technician' ? [
        {
          id: '1',
          title: 'Concert Audio Setup',
          description: 'Main stage audio setup for outdoor concert',
          date: '2024-12-25',
          startTime: '14:00',
          endTime: '23:00',
          location: 'Central Park, NYC',
          status: 'confirmed',
          companyId: 'company_1',
          rate: 85,
          totalAmount: 765,
          skills: ['Audio Engineering', 'Live Sound'],
          equipment: ['Digital Console', 'Line Array'],
          createdAt: '2024-12-20T10:00:00Z',
          updatedAt: '2024-12-20T10:00:00Z',
        },
        {
          id: '2',
          title: 'Corporate Event AV',
          description: 'Audio/Visual setup for corporate presentation',
          date: '2024-12-28',
          startTime: '08:00',
          endTime: '17:00',
          location: 'Manhattan Conference Center',
          status: 'pending',
          companyId: 'company_2',
          rate: 75,
          totalAmount: 675,
          skills: ['Audio Engineering', 'Video Engineering'],
          createdAt: '2024-12-21T15:30:00Z',
          updatedAt: '2024-12-21T15:30:00Z',
        },
      ] : [
        {
          id: '3',
          title: 'Wedding Reception',
          description: 'DJ and lighting setup for wedding reception',
          date: '2024-12-30',
          startTime: '17:00',
          endTime: '01:00',
          location: 'Grand Ballroom, Hotel Plaza',
          status: 'confirmed',
          technicianId: 'tech_1',
          companyId: user.id,
          rate: 90,
          totalAmount: 720,
          skills: ['DJ Services', 'Lighting Design'],
          createdAt: '2024-12-19T12:00:00Z',
          updatedAt: '2024-12-20T09:15:00Z',
        },
      ]

      // Apply filters (mock implementation)
      let filteredBookings = mockBookings
      
      if (filters?.status?.length) {
        filteredBookings = filteredBookings.filter(booking => 
          filters.status!.includes(booking.status)
        )
      }

      if (filters?.skills?.length) {
        filteredBookings = filteredBookings.filter(booking =>
          booking.skills.some(skill => filters.skills!.includes(skill))
        )
      }

      // Mock delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setBookings(filteredBookings)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch bookings'
      setError(errorMessage)
      showError('Error', errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [user, showError])

  // Create booking
  const createBooking = useCallback(async (bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return

    setIsLoading(true)

    try {
      // TODO: Replace with actual API call
      console.log('Creating booking:', bookingData)
      
      const newBooking: Booking = {
        ...bookingData,
        id: `booking_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Mock delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setBookings(prev => [newBooking, ...prev])
      showSuccess('Success', 'Booking created successfully')
      
      return newBooking
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create booking'
      showError('Error', errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [user, showSuccess, showError])

  // Update booking
  const updateBooking = useCallback(async (id: string, updates: Partial<Booking>) => {
    setIsLoading(true)

    try {
      // TODO: Replace with actual API call
      console.log('Updating booking:', id, updates)
      
      // Mock delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setBookings(prev => prev.map(booking => 
        booking.id === id 
          ? { ...booking, ...updates, updatedAt: new Date().toISOString() }
          : booking
      ))
      
      showSuccess('Success', 'Booking updated successfully')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update booking'
      showError('Error', errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [showSuccess, showError])

  // Cancel booking
  const cancelBooking = useCallback(async (id: string, reason?: string) => {
    setIsLoading(true)

    try {
      // TODO: Replace with actual API call
      console.log('Cancelling booking:', id, 'reason:', reason)
      
      // Mock delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setBookings(prev => prev.map(booking => 
        booking.id === id 
          ? { ...booking, status: 'cancelled' as const, updatedAt: new Date().toISOString() }
          : booking
      ))
      
      showSuccess('Success', 'Booking cancelled successfully')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel booking'
      showError('Error', errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [showSuccess, showError])

  // Apply to booking (for technicians)
  const applyToBooking = useCallback(async (bookingId: string, application: any) => {
    if (!user || user.role !== 'technician') return

    setIsLoading(true)

    try {
      // TODO: Replace with actual API call
      console.log('Applying to booking:', bookingId, application)
      
      // Mock delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      showSuccess('Success', 'Application submitted successfully')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to apply to booking'
      showError('Error', errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [user, showSuccess, showError])

  // Load bookings on mount
  useEffect(() => {
    if (user) {
      fetchBookings()
    }
  }, [user, fetchBookings])

  return {
    bookings,
    isLoading,
    error,
    fetchBookings,
    createBooking,
    updateBooking,
    cancelBooking,
    applyToBooking,
  }
}