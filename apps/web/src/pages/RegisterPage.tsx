import { useNavigate } from 'react-router-dom'
import { Register } from '@/sections/authentication/components'
import type { RegisterFormData, OAuthProviderId, OAuthProvider } from '@/sections/authentication/types'
import data from '@/sections/authentication/data.json'

export function RegisterPage() {
  const navigate = useNavigate()

  const handleRegister = async (formData: RegisterFormData) => {
    console.log('Register:', formData)
    // TODO: Implement actual registration logic
  }

  const handleOAuthLogin = async (provider: OAuthProviderId) => {
    console.log('OAuth login with:', provider)
    // TODO: Implement OAuth logic
  }

  const handleNavigateToLogin = () => {
    navigate('/login')
  }

  return (
    <Register
      onRegister={handleRegister}
      onOAuthLogin={handleOAuthLogin}
      onNavigateToLogin={handleNavigateToLogin}
      isLoading={false}
      error={null}
      oauthProviders={data.oauthProviders as OAuthProvider[]}
    />
  )
}
