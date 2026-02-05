import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useSignUp } from '@clerk/clerk-react'
import { Register } from '@/sections/authentication/components'
import type { RegisterFormData, OAuthProviderId, OAuthProvider } from '@/sections/authentication/types'
import data from '@/sections/authentication/data.json'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { signUp } = useSignUp()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRegister = async (formData: RegisterFormData) => {
    console.log('Register:', formData)
    // TODO: Implement actual registration logic
  }

  const handleOAuthLogin = async (provider: OAuthProviderId) => {
    if (!signUp) {
      setError('Sign up not available')
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      // Start OAuth flow
      await signUp.authenticateWithRedirect({
        strategy: `oauth_${provider}` as any,
        redirectUrl: window.location.origin + '/sso-callback',
        redirectUrlComplete: window.location.origin + '/profile-completion',
      })
    } catch (err) {
      console.error('OAuth error:', err)
      setError(err instanceof Error ? err.message : 'OAuth registration failed')
      setIsLoading(false)
    }
  }

  const handleNavigateToLogin = () => {
    navigate('/login')
  }

  return (
    <Register
      onRegister={handleRegister}
      onOAuthLogin={handleOAuthLogin}
      onNavigateToLogin={handleNavigateToLogin}
      isLoading={isLoading}
      error={error ? { message: error, code: 'OAUTH_ERROR' } : null}
      oauthProviders={data.oauthProviders as OAuthProvider[]}
    />
  )
}
