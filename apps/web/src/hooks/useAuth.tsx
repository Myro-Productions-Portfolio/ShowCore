import { useState, useEffect, createContext, useContext, ReactNode } from 'react'

// Types
export interface User {
  id: string
  email: string
  name: string
  role: 'technician' | 'company'
  profileComplete: boolean
  emailVerified: boolean
  avatar?: string
}

export interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

export interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, role: 'technician' | 'company') => Promise<void>
  logout: () => Promise<void>
  updateProfile: (updates: Partial<User>) => Promise<void>
  sendPasswordReset: (email: string) => Promise<void>
  resetPassword: (token: string, password: string) => Promise<void>
  sendEmailVerification: () => Promise<void>
  verifyEmail: (token: string) => Promise<void>
}

// Context
const AuthContext = createContext<AuthContextValue | null>(null)

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  })

  // Initialize auth state
  useEffect(() => {
    // Check for existing session
    const initAuth = async () => {
      try {
        // TODO: Replace with actual auth service (Clerk)
        const storedUser = localStorage.getItem('showcore_user')
        if (storedUser) {
          const user = JSON.parse(storedUser)
          setAuthState({
            user,
            isLoading: false,
            isAuthenticated: true,
          })
        } else {
          setAuthState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
          })
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        })
      }
    }

    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true }))
    
    try {
      // TODO: Replace with actual auth service (Clerk)
      console.log('Login attempt:', { email, password })
      
      // Mock successful login
      const mockUser: User = {
        id: 'user_1',
        email,
        name: email.split('@')[0],
        role: 'technician',
        profileComplete: true,
        emailVerified: true,
      }
      
      localStorage.setItem('showcore_user', JSON.stringify(mockUser))
      
      setAuthState({
        user: mockUser,
        isLoading: false,
        isAuthenticated: true,
      })
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }))
      throw error
    }
  }

  const register = async (email: string, password: string, role: 'technician' | 'company') => {
    setAuthState(prev => ({ ...prev, isLoading: true }))
    
    try {
      // TODO: Replace with actual auth service (Clerk)
      console.log('Register attempt:', { email, password, role })
      
      // Mock successful registration
      const mockUser: User = {
        id: 'user_new',
        email,
        name: email.split('@')[0],
        role,
        profileComplete: false,
        emailVerified: false,
      }
      
      localStorage.setItem('showcore_user', JSON.stringify(mockUser))
      
      setAuthState({
        user: mockUser,
        isLoading: false,
        isAuthenticated: true,
      })
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }))
      throw error
    }
  }

  const logout = async () => {
    try {
      // TODO: Replace with actual auth service (Clerk)
      localStorage.removeItem('showcore_user')
      
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      })
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  }

  const updateProfile = async (updates: Partial<User>) => {
    if (!authState.user) return
    
    try {
      // TODO: Replace with actual API call
      const updatedUser = { ...authState.user, ...updates }
      localStorage.setItem('showcore_user', JSON.stringify(updatedUser))
      
      setAuthState(prev => ({
        ...prev,
        user: updatedUser,
      }))
    } catch (error) {
      console.error('Profile update error:', error)
      throw error
    }
  }

  const sendPasswordReset = async (email: string) => {
    try {
      // TODO: Replace with actual auth service (Clerk)
      console.log('Password reset requested for:', email)
      // Mock delay
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error('Password reset error:', error)
      throw error
    }
  }

  const resetPassword = async (token: string, password: string) => {
    try {
      // TODO: Replace with actual auth service (Clerk)
      console.log('Password reset with token:', { token, password })
      // Mock delay
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error('Password reset error:', error)
      throw error
    }
  }

  const sendEmailVerification = async () => {
    try {
      // TODO: Replace with actual auth service (Clerk)
      console.log('Email verification sent')
      // Mock delay
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error('Email verification error:', error)
      throw error
    }
  }

  const verifyEmail = async (token: string) => {
    try {
      // TODO: Replace with actual auth service (Clerk)
      console.log('Email verified with token:', token)
      
      if (authState.user) {
        const updatedUser = { ...authState.user, emailVerified: true }
        localStorage.setItem('showcore_user', JSON.stringify(updatedUser))
        
        setAuthState(prev => ({
          ...prev,
          user: updatedUser,
        }))
      }
    } catch (error) {
      console.error('Email verification error:', error)
      throw error
    }
  }

  const contextValue: AuthContextValue = {
    ...authState,
    login,
    register,
    logout,
    updateProfile,
    sendPasswordReset,
    resetPassword,
    sendEmailVerification,
    verifyEmail,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}