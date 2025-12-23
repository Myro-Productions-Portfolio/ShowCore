import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Login } from '@/sections/authentication/components'
import type { LoginFormData, MagicLinkRequestData, OAuthProviderId, OAuthProvider } from '@/sections/authentication/types'
import data from '@/sections/authentication/data.json'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
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
    console.log('Magic link request:', formData)
    // TODO: Implement magic link logic
  }

  const handleOAuthLogin = async (provider: OAuthProviderId) => {
    console.log('OAuth login:', provider)
    // TODO: Implement OAuth logic
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
