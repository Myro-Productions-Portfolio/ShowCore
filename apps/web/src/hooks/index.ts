// Authentication
export { useAuth, AuthProvider } from './useAuth'
export type { User, AuthState, AuthContextValue } from './useAuth'

// API and Data Fetching
export { useApi, useBookingsApi, useTechniciansApi, useReviewsApi } from './useApi'
export type { ApiState, ApiOptions } from './useApi'

// Business Logic
export { useBookings } from './useBookings'
export type { Booking, BookingFilters } from './useBookings'

export { usePayments, usePayouts } from './usePayments'
export type { PaymentMethod, PayoutMethod, Transaction } from './usePayments'

// Local Storage and Preferences
export { useLocalStorage } from './useLocalStorage'

// Notifications and Toasts
export { useNotifications, NotificationProvider, usePushNotifications } from './useNotifications'
export type { Notification, NotificationAction, NotificationContextValue } from './useNotifications'

// Theme and Appearance
export { useTheme, useReducedMotion } from './useTheme'
export type { Theme } from './useTheme'

// Form Management
export { useForm } from './useForm'
export type { FormField, FormState, ValidationRule, FormConfig } from './useForm'

// Debouncing and Performance
export { useDebounce, useDebouncedCallback, useDebouncedSearch } from './useDebounce'

// WebSocket and Real-time
export { useWebSocket, useRealtimeMessaging } from './useWebSocket'
export type { WebSocketMessage, WebSocketState, WebSocketOptions } from './useWebSocket'

// Responsive Design
export { useMediaQuery, useBreakpoints, useOrientation, useTouchDevice } from './useMediaQuery'

// UI Interactions
export { useClickOutside, useEscapeKey, useModalBehavior } from './useClickOutside'