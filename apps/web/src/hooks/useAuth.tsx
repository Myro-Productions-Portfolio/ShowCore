import { useUser, useClerk, useSignIn, useSignUp } from '@clerk/clerk-react'
import { createContext, useContext, ReactNode } from 'react'

// Types
export interface User {
  id: string
  email: string
  name: string
  role: 'technician' | 'company' | 'admin'
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
  const { user: clerkUser, isLoaded, isSignedIn } = useUser()
  const { signOut } = useClerk()
  const { signIn } = useSignIn()
  const { signUp } = useSignUp()

  // Convert Clerk user to our User type
  const user: User | null = clerkUser && isSignedIn ? {
    id: clerkUser.id,
    email: clerkUser.primaryEmailAddress?.emailAddress || '',
    name: clerkUser.fullName || clerkUser.firstName || clerkUser.username || 'User',
    role: (clerkUser.publicMetadata?.role as 'technician' | 'company' | 'admin') || 'technician',
    profileComplete: clerkUser.publicMetadata?.profileComplete as boolean || false,
    emailVerified: clerkUser.primaryEmailAddress?.verification.status === 'verified',
    avatar: clerkUser.imageUrl,
  } : null

  const authState: AuthState = {
    user,
    isLoading: !isLoaded,
    isAuthenticated: isSignedIn || false,
  }

  const login = async (email: string, password: string) => {
    if (!signIn) throw new Error('Sign in not available')
    
    try {
      const result = await signIn.create({
        identifier: email,
        password,
      })

      if (result.status === 'complete') {
        await signIn.setActive({ session: result.createdSessionId })
      }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  const register = async (email: string, password: string, role: 'technician' | 'company') => {
    if (!signUp) throw new Error('Sign up not available')
    
    try {
      await signUp.create({
        emailAddress: email,
        password,
      })

      // Send email verification
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })

      // Set role in public metadata
      await signUp.update({
        unsafeMetadata: {
          role,
          profileComplete: false,
        },
      })
    } catch (error) {
      console.error('Register error:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  }

  const updateProfile = async (updates: Partial<User>) => {
    if (!clerkUser) return
    
    try {
      await clerkUser.update({
        firstName: updates.name?.split(' ')[0],
        lastName: updates.name?.split(' ').slice(1).join(' '),
      })

      // Update metadata if role or profileComplete changed
      if (updates.role || updates.profileComplete !== undefined) {
        await clerkUser.update({
          unsafeMetadata: {
            role: updates.role || clerkUser.publicMetadata?.role,
            profileComplete: updates.profileComplete ?? clerkUser.publicMetadata?.profileComplete,
          },
        })
      }
    } catch (error) {
      console.error('Profile update error:', error)
      throw error
    }
  }

  const sendPasswordReset = async (email: string) => {
    if (!signIn) throw new Error('Sign in not available')
    
    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      })
    } catch (error) {
      console.error('Password reset error:', error)
      throw error
    }
  }

  const resetPassword = async (code: string, password: string) => {
    if (!signIn) throw new Error('Sign in not available')
    
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
        password,
      })

      if (result.status === 'complete') {
        await signIn.setActive({ session: result.createdSessionId })
      }
    } catch (error) {
      console.error('Password reset error:', error)
      throw error
    }
  }

  const sendEmailVerification = async () => {
    if (!clerkUser) return
    
    try {
      await clerkUser.primaryEmailAddress?.prepareVerification({ strategy: 'email_code' })
    } catch (error) {
      console.error('Email verification error:', error)
      throw error
    }
  }

  const verifyEmail = async (code: string) => {
    if (!clerkUser) return
    
    try {
      await clerkUser.primaryEmailAddress?.attemptVerification({ code })
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
