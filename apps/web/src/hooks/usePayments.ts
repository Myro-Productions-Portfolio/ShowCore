import { useState, useCallback } from 'react'
import { useAuth } from './useAuth'
import { useNotifications } from './useNotifications'

// Types
export interface PaymentMethod {
  id: string
  type: 'card' | 'bank_account' | 'paypal'
  isDefault: boolean
  // Card specific
  cardBrand?: 'visa' | 'mastercard' | 'amex' | 'discover'
  last4?: string
  expiryMonth?: number
  expiryYear?: number
  // Bank account specific
  bankName?: string
  accountType?: 'checking' | 'savings'
  routingNumber?: string
  // PayPal specific
  email?: string
  verified?: boolean
  createdAt: string
}

export interface PayoutMethod {
  id: string
  type: 'bank_account' | 'paypal'
  isDefault: boolean
  // Bank account
  bankName?: string
  accountHolderName?: string
  accountNumberLast4?: string
  routingNumber?: string
  accountType?: 'checking' | 'savings'
  // PayPal
  email?: string
  verified?: boolean
  createdAt: string
}

export interface Transaction {
  id: string
  type: 'payment' | 'payout' | 'refund' | 'fee'
  amount: number
  currency: 'USD'
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  description: string
  bookingId?: string
  paymentMethodId?: string
  createdAt: string
  processedAt?: string
}

/**
 * Hook for managing payments (for companies)
 */
export function usePayments() {
  const { user } = useAuth()
  const { showSuccess, showError } = useNotifications()
  
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Fetch payment methods
  const fetchPaymentMethods = useCallback(async () => {
    if (!user || user.role !== 'company') return

    setIsLoading(true)

    try {
      // TODO: Replace with actual Stripe API call
      console.log('Fetching payment methods for company:', user.id)
      
      // Mock data
      const mockMethods: PaymentMethod[] = [
        {
          id: 'pm_1',
          type: 'card',
          isDefault: true,
          cardBrand: 'visa',
          last4: '4242',
          expiryMonth: 12,
          expiryYear: 2027,
          createdAt: '2024-01-15T10:00:00Z',
        },
        {
          id: 'pm_2',
          type: 'card',
          isDefault: false,
          cardBrand: 'mastercard',
          last4: '8888',
          expiryMonth: 6,
          expiryYear: 2026,
          createdAt: '2024-03-20T14:30:00Z',
        },
      ]

      await new Promise(resolve => setTimeout(resolve, 1000))
      setPaymentMethods(mockMethods)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch payment methods'
      showError('Error', errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [user, showError])

  // Add payment method
  const addPaymentMethod = useCallback(async (paymentData: any) => {
    if (!user || user.role !== 'company') return

    setIsLoading(true)

    try {
      // TODO: Replace with actual Stripe API call
      console.log('Adding payment method:', paymentData)
      
      const newMethod: PaymentMethod = {
        id: `pm_${Date.now()}`,
        type: 'card',
        isDefault: paymentMethods.length === 0,
        cardBrand: 'visa',
        last4: paymentData.cardNumber.slice(-4),
        expiryMonth: paymentData.expiryMonth,
        expiryYear: paymentData.expiryYear,
        createdAt: new Date().toISOString(),
      }

      await new Promise(resolve => setTimeout(resolve, 1500))
      
      setPaymentMethods(prev => [...prev, newMethod])
      showSuccess('Success', 'Payment method added successfully')
      
      return newMethod
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add payment method'
      showError('Error', errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [user, paymentMethods.length, showSuccess, showError])

  // Remove payment method
  const removePaymentMethod = useCallback(async (methodId: string) => {
    setIsLoading(true)

    try {
      // TODO: Replace with actual Stripe API call
      console.log('Removing payment method:', methodId)
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setPaymentMethods(prev => prev.filter(method => method.id !== methodId))
      showSuccess('Success', 'Payment method removed successfully')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove payment method'
      showError('Error', errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [showSuccess, showError])

  // Set default payment method
  const setDefaultPaymentMethod = useCallback(async (methodId: string) => {
    setIsLoading(true)

    try {
      // TODO: Replace with actual Stripe API call
      console.log('Setting default payment method:', methodId)
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setPaymentMethods(prev => prev.map(method => ({
        ...method,
        isDefault: method.id === methodId,
      })))
      
      showSuccess('Success', 'Default payment method updated')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update default payment method'
      showError('Error', errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [showSuccess, showError])

  // Process payment
  const processPayment = useCallback(async (amount: number, bookingId: string, paymentMethodId?: string) => {
    setIsLoading(true)

    try {
      // TODO: Replace with actual Stripe API call
      console.log('Processing payment:', { amount, bookingId, paymentMethodId })
      
      const transaction: Transaction = {
        id: `txn_${Date.now()}`,
        type: 'payment',
        amount,
        currency: 'USD',
        status: 'completed',
        description: `Payment for booking ${bookingId}`,
        bookingId,
        paymentMethodId,
        createdAt: new Date().toISOString(),
        processedAt: new Date().toISOString(),
      }

      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setTransactions(prev => [transaction, ...prev])
      showSuccess('Success', 'Payment processed successfully')
      
      return transaction
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed'
      showError('Error', errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [showSuccess, showError])

  return {
    paymentMethods,
    transactions,
    isLoading,
    fetchPaymentMethods,
    addPaymentMethod,
    removePaymentMethod,
    setDefaultPaymentMethod,
    processPayment,
  }
}

/**
 * Hook for managing payouts (for technicians)
 */
export function usePayouts() {
  const { user } = useAuth()
  const { showSuccess, showError } = useNotifications()
  
  const [payoutMethods, setPayoutMethods] = useState<PayoutMethod[]>([])
  const [payouts] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Fetch payout methods
  const fetchPayoutMethods = useCallback(async () => {
    if (!user || user.role !== 'technician') return

    setIsLoading(true)

    try {
      // TODO: Replace with actual Stripe Connect API call
      console.log('Fetching payout methods for technician:', user.id)
      
      // Mock data
      const mockMethods: PayoutMethod[] = [
        {
          id: 'po_1',
          type: 'bank_account',
          isDefault: true,
          bankName: 'Chase Bank',
          accountHolderName: user.name,
          accountNumberLast4: '4892',
          routingNumber: '021000021',
          accountType: 'checking',
          createdAt: '2024-01-20T12:00:00Z',
        },
        {
          id: 'po_2',
          type: 'paypal',
          isDefault: false,
          email: user.email,
          verified: true,
          createdAt: '2024-02-15T09:30:00Z',
        },
      ]

      await new Promise(resolve => setTimeout(resolve, 1000))
      setPayoutMethods(mockMethods)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch payout methods'
      showError('Error', errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [user, showError])

  // Add payout method
  const addPayoutMethod = useCallback(async (methodData: any) => {
    if (!user || user.role !== 'technician') return

    setIsLoading(true)

    try {
      // TODO: Replace with actual Stripe Connect API call
      console.log('Adding payout method:', methodData)
      
      const newMethod: PayoutMethod = {
        id: `po_${Date.now()}`,
        type: methodData.type,
        isDefault: payoutMethods.length === 0,
        ...methodData,
        createdAt: new Date().toISOString(),
      }

      await new Promise(resolve => setTimeout(resolve, 1500))
      
      setPayoutMethods(prev => [...prev, newMethod])
      showSuccess('Success', 'Payout method added successfully')
      
      return newMethod
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add payout method'
      showError('Error', errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [user, payoutMethods.length, showSuccess, showError])

  // Remove payout method
  const removePayoutMethod = useCallback(async (methodId: string) => {
    setIsLoading(true)

    try {
      // TODO: Replace with actual Stripe Connect API call
      console.log('Removing payout method:', methodId)
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setPayoutMethods(prev => prev.filter(method => method.id !== methodId))
      showSuccess('Success', 'Payout method removed successfully')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove payout method'
      showError('Error', errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [showSuccess, showError])

  return {
    payoutMethods,
    payouts,
    isLoading,
    fetchPayoutMethods,
    addPayoutMethod,
    removePayoutMethod,
  }
}