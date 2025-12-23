import { useState, useCallback, createContext, useContext, ReactNode } from 'react'

// Types
export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  actions?: NotificationAction[]
  createdAt: Date
}

export interface NotificationAction {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
}

export interface NotificationContextValue {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => string
  removeNotification: (id: string) => void
  clearAllNotifications: () => void
  showSuccess: (title: string, message?: string) => string
  showError: (title: string, message?: string) => string
  showWarning: (title: string, message?: string) => string
  showInfo: (title: string, message?: string) => string
}

// Context
const NotificationContext = createContext<NotificationContextValue | null>(null)

// Provider component
export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt'>) => {
    const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newNotification: Notification = {
      ...notification,
      id,
      createdAt: new Date(),
    }

    setNotifications(prev => [...prev, newNotification])

    // Auto-remove after duration (default 5 seconds)
    const duration = notification.duration ?? 5000
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, duration)
    }

    return id
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }, [])

  const clearAllNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  const showSuccess = useCallback((title: string, message = '') => {
    return addNotification({
      type: 'success',
      title,
      message,
      duration: 3000,
    })
  }, [addNotification])

  const showError = useCallback((title: string, message = '') => {
    return addNotification({
      type: 'error',
      title,
      message,
      duration: 5000,
    })
  }, [addNotification])

  const showWarning = useCallback((title: string, message = '') => {
    return addNotification({
      type: 'warning',
      title,
      message,
      duration: 4000,
    })
  }, [addNotification])

  const showInfo = useCallback((title: string, message = '') => {
    return addNotification({
      type: 'info',
      title,
      message,
      duration: 4000,
    })
  }, [addNotification])

  const contextValue: NotificationContextValue = {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  }

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  )
}

// Hook
export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

/**
 * Hook for push notification permissions and management
 */
export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(false)

  // Check if push notifications are supported
  useState(() => {
    setIsSupported('Notification' in window && 'serviceWorker' in navigator)
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  })

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      throw new Error('Push notifications are not supported')
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      return result
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      throw error
    }
  }, [isSupported])

  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!isSupported || permission !== 'granted') {
      console.warn('Cannot send notification: permission not granted or not supported')
      return null
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      })

      return notification
    } catch (error) {
      console.error('Error sending notification:', error)
      return null
    }
  }, [isSupported, permission])

  return {
    permission,
    isSupported,
    requestPermission,
    sendNotification,
  }
}