import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { Home, Search, Calendar, Award, Star, BarChart3, Settings, HelpCircle, Bell, X, CheckCircle, MessageCircle } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import { useAuth } from '../hooks/useAuth'
import { AppShell } from './shell/AppShell'
import type { NavItem } from './shell/MainNav'
import type { AIAssistantState, AIMessage, QuickAction, SuggestedAction } from '../../../../shell/components/AIAssistant'
import { getAIResponse, getQuickActions, getGreetingMessage } from '../lib/aiResponses'

export function AppLayout() {
  // Test comment for HMR refresh
  const navigate = useNavigate()
  const location = useLocation()
  const { } = useTheme() // Theme hook is used for side effects (initialization)
  const { user, isLoading, isAuthenticated, logout } = useAuth()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const notificationsRef = useRef<HTMLDivElement>(null)
  
  // Mock notifications data
  const [notifications] = useState([
    {
      id: 'notif-1',
      type: 'booking',
      title: 'New Booking Request',
      message: 'Sarah Martinez sent you a booking request for Corporate Annual Gala 2025',
      timestamp: '2 minutes ago',
      read: false,
      actionUrl: '/bookings/booking-001'
    },
    {
      id: 'notif-2',
      type: 'message',
      title: 'New Message',
      message: 'Marcus Chen: "Perfect! The CL5 and Meyer system are great..."',
      timestamp: '1 hour ago',
      read: false,
      actionUrl: '/bookings/booking-001'
    },
    {
      id: 'notif-3',
      type: 'review',
      title: 'New Review',
      message: 'You received a 5-star review from Jamie Thompson',
      timestamp: '3 hours ago',
      read: true,
      actionUrl: '/reviews'
    },
    {
      id: 'notif-4',
      type: 'system',
      title: 'Profile Verification Complete',
      message: 'Your ID verification has been approved',
      timestamp: '1 day ago',
      read: true,
      actionUrl: '/settings'
    },
    {
      id: 'notif-5',
      type: 'booking',
      title: 'Booking Confirmed',
      message: 'Your booking for Live Music Festival - Main Stage has been confirmed',
      timestamp: '2 days ago',
      read: true,
      actionUrl: '/bookings/booking-003'
    }
  ])

  const unreadCount = notifications.filter(n => !n.read).length
  
  // AI Assistant state
  const [aiState, setAiState] = useState<AIAssistantState>({
    state: 'closed',
    conversation: {
      id: 'main-conversation',
      messages: [],
      context: {
        currentPage: location.pathname,
        userRole: 'technician', // This would come from user data in real implementation
        userId: 'current-user',
        onboardingComplete: false
      },
      createdAt: new Date().toISOString(),
      lastMessageAt: new Date().toISOString()
    },
    quickActions: getQuickActions(location.pathname),
    isTyping: false
  })

  // Check authentication state on mount
  useEffect(() => {
    // Temporarily bypass auth check for debugging
    console.log('Auth state:', { isLoading, isAuthenticated, user })
    
    // Only redirect if we're sure there's no user and loading is complete
    if (!isLoading && !isAuthenticated && !user) {
      console.log('Redirecting to login - no authenticated user found')
      navigate('/login')
    }
  }, [isLoading, isAuthenticated, user, navigate])

  // Update AI context when page changes
  useEffect(() => {
    setAiState((prev: AIAssistantState) => ({
      ...prev,
      conversation: {
        ...prev.conversation,
        context: {
          ...prev.conversation.context,
          currentPage: location.pathname
        }
      },
      quickActions: getQuickActions(location.pathname)
    }))
  }, [location.pathname])

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false)
      }
    }

    if (notificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [notificationsOpen])

  const navigationItems: NavItem[] = [
    { label: 'Dashboard', href: '/', icon: Home, isActive: location.pathname === '/' },
    { label: 'Discover', href: '/discovery', icon: Search, isActive: location.pathname === '/discovery' },
    { label: 'Bookings', href: '/bookings', icon: Calendar, isActive: location.pathname === '/bookings' },
    { label: 'Show Proof', href: '/show-proof', icon: Award, isActive: location.pathname === '/show-proof' },
    { label: 'Reviews', href: '/reviews', icon: Star, isActive: location.pathname === '/reviews' },
    { label: 'Analytics', href: '/analytics', icon: BarChart3, isActive: location.pathname === '/analytics' },
    { label: '', href: '', icon: Search, isDivider: true },
    { label: 'Settings', href: '/settings', icon: Settings, isActive: location.pathname === '/settings' },
    { label: 'Help', href: '/help', icon: HelpCircle },
  ]

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
      // Fallback: navigate to login anyway
      navigate('/login')
    }
  }

  const handleSettings = () => {
    navigate('/settings')
  }

  const handleViewProfile = () => {
    navigate('/settings')
  }

  const handleNotificationsClick = () => {
    setNotificationsOpen(!notificationsOpen)
  }

  const handleNotificationClick = (notification: any) => {
    navigate(notification.actionUrl)
    setNotificationsOpen(false)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return <Calendar className="w-4 h-4 text-blue-500" />
      case 'message':
        return <MessageCircle className="w-4 h-4 text-green-500" />
      case 'review':
        return <Star className="w-4 h-4 text-amber-500" />
      case 'system':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />
      default:
        return <Bell className="w-4 h-4 text-zinc-500" />
    }
  }

  // AI Assistant handlers
  const handleAIStateChange = (state: 'closed' | 'minimized' | 'open') => {
    setAiState((prev: AIAssistantState) => {
      // If opening for the first time and no messages, add greeting
      if (state === 'open' && prev.state === 'closed' && prev.conversation.messages.length === 0) {
        const greetingMessage: AIMessage = {
          id: `msg-${Date.now()}-greeting`,
          sender: 'assistant',
          content: getGreetingMessage(location.pathname, prev.conversation.context.userRole),
          contentType: 'text',
          timestamp: new Date().toISOString(),
          relativeTime: 'now'
        }
        
        return {
          ...prev,
          state,
          conversation: {
            ...prev.conversation,
            messages: [greetingMessage],
            lastMessageAt: new Date().toISOString()
          }
        }
      }
      
      return { ...prev, state }
    })
  }

  const handleAIMessage = async (message: string) => {
    // Add user message
    const userMessage: AIMessage = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      content: message,
      contentType: 'text',
      timestamp: new Date().toISOString(),
      relativeTime: 'now'
    }

    setAiState((prev: AIAssistantState) => ({
      ...prev,
      conversation: {
        ...prev.conversation,
        messages: [...prev.conversation.messages, userMessage],
        lastMessageAt: new Date().toISOString()
      },
      isTyping: true
    }))

    // Simulate AI response delay
    setTimeout(() => {
      const aiResponse = getAIResponse(
        message, 
        location.pathname, 
        aiState.conversation.context.userRole
      )

      const assistantMessage: AIMessage = {
        id: `msg-${Date.now()}-assistant`,
        sender: 'assistant',
        content: aiResponse.message,
        contentType: 'text',
        timestamp: new Date().toISOString(),
        relativeTime: 'now',
        actions: aiResponse.suggestedActions
      }

      setAiState((prev: AIAssistantState) => ({
        ...prev,
        conversation: {
          ...prev.conversation,
          messages: [...prev.conversation.messages, assistantMessage],
          lastMessageAt: new Date().toISOString()
        },
        isTyping: false
      }))
    }, 1000 + Math.random() * 1000) // Random delay between 1-2 seconds
  }

  const handleAIActionClick = (action: SuggestedAction) => {
    if (action.type === 'navigate' && action.url) {
      navigate(action.url)
    }
    // Other action types would be handled here in a real implementation
  }

  const handleAIQuickActionClick = (quickAction: QuickAction) => {
    handleAIMessage(quickAction.prompt)
  }

  // Show loading state while checking authentication
  if (isLoading) {
    console.log('AppLayout: Showing loading state')
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-900">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-600 dark:text-zinc-400">Loading ShowCore...</p>
        </div>
      </div>
    )
  }

  // Don't render the app shell if user is not authenticated
  if (!isAuthenticated || !user) {
    console.log('AppLayout: No authenticated user, returning null')
    return null // This will trigger the redirect in useEffect
  }

  console.log('AppLayout: Rendering app shell for user:', user?.email)

  return (
    <div className="relative">
      <AppShell
        navigationItems={navigationItems}
        user={user}
        notificationCount={unreadCount}
        onNavigate={(href) => navigate(href)}
        onLogout={handleLogout}
        onSettings={handleSettings}
        onViewProfile={handleViewProfile}
        onNotificationsClick={handleNotificationsClick}
        showAIAssistant={true}
        aiAssistantState={aiState}
        onAIAssistantStateChange={handleAIStateChange}
        onAIAssistantSendMessage={handleAIMessage}
        onAIAssistantActionClick={handleAIActionClick}
        onAIAssistantQuickActionClick={handleAIQuickActionClick}
      >
        <Outlet />
      </AppShell>

      {/* Notifications Dropdown */}
      {notificationsOpen && (
        <div
          ref={notificationsRef}
          className="fixed top-16 right-4 z-50 w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg max-h-96 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Notifications
            </h3>
            <button
              onClick={() => setNotificationsOpen(false)}
              className="p-1 rounded-md text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                <p className="text-zinc-500 dark:text-zinc-400">No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer transition-colors ${
                      !notification.read ? 'bg-amber-50 dark:bg-amber-900/10' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                          {notification.timestamp}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => {
                  navigate('/notifications')
                  setNotificationsOpen(false)
                }}
                className="w-full text-sm text-amber-800 dark:text-amber-100 hover:text-amber-900 dark:hover:text-amber-50 font-medium"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
