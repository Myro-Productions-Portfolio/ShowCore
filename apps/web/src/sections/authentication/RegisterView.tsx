import { Register } from './components'
import type { RegisterFormData, OAuthProviderId, OAuthProvider } from '../types'
import sampleData from '../data.json'

export default function RegisterView() {
  const handleRegister = async (data: RegisterFormData) => {
    console.log('Register:', data)
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500))
  }

  const handleOAuthLogin = async (provider: OAuthProviderId) => {
    console.log('OAuth login with:', provider)
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const handleNavigateToLogin = () => {
    console.log('Navigate to login')
  }

  return (
    <Register
      onRegister={handleRegister}
      onOAuthLogin={handleOAuthLogin}
      onNavigateToLogin={handleNavigateToLogin}
      oauthProviders={sampleData.oauthProviders as OAuthProvider[]}
    />
  )
}
