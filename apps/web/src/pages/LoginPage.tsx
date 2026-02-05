import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useSignIn } from '@clerk/clerk-react'
import { Login } from '@/sections/authentication/components'
import type { LoginFormData, MagicLinkRequestData, OAuthProviderId, OAuthProvider } from '@/sections/authentication/types'
import data from '@/sections/authentication/data.json'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { signIn } = useSignIn()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (formData: LoginFormData) => {
    setIsLoading(true)
    setError(null)
    
    try {
      await login(formData.email, formData.password)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMagicLinkRequest = async (formData: MagicLinkRequestData) => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Clerk magic link implementation
      const { signIn } = await import('@clerk/clerk-react')
      // This will be implemented when we add magic link support
      console.log('Magic link request:', formData)
      setError('Magic link authentication is coming soon!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Magic link request failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthLogin = async (provider: OAuthProviderId) => {
    if (!signIn) {
      setError('Sign in not available')
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      // Start OAuth flow
      await signIn.authenticateWithRedirect({
        strategy: `oauth_${provider}` as any,
        redirectUrl: window.location.origin + '/sso-callback',
        redirectUrlComplete: window.location.origin + '/',
      })
    } catch (err) {
      console.error('OAuth error:', err)
      setError(err instanceof Error ? err.message : 'OAuth login failed')
      setIsLoading(false)
    }
  }

  const handleNavigateToRegister = () => {
    navigate('/register')
  }

  const handleNavigateToPasswordReset = () => {
    navigate('/forgot-password')
  }

  return (
    <Login
      onLogin={handleLogin}
      onMagicLinkRequest={handleMagicLinkRequest}
      onOAuthLogin={handleOAuthLogin}
      onNavigateToRegister={handleNavigateToRegister}
      onNavigateToPasswordReset={handleNavigateToPasswordReset}
      isLoading={isLoading}
      error={error ? { message: error, code: 'LOGIN_ERROR' } : null}
      oauthProviders={data.oauthProviders as OAuthProvider[]}
    />
  )
}
