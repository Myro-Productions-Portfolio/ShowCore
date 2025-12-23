import { useNavigate } from 'react-router-dom'
import { Login } from '@/sections/authentication/components'
import type { LoginFormData, MagicLinkRequestData, OAuthProviderId, OAuthProvider } from '@/sections/authentication/types'
import data from '@/sections/authentication/data.json'

export function LoginPage() {
  const navigate = useNavigate()

  const handleLogin = async (formData: LoginFormData) => {
    console.log('Login attempt:', formData)
    // TODO: Implement actual login logic
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
      isLoading={false}
      error={null}
      oauthProviders={data.oauthProviders as OAuthProvider[]}
    />
  )
}
