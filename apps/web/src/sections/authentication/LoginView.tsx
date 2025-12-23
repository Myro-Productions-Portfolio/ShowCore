import data from './data.json'
import { Login } from './components'
import type { OAuthProvider } from './types'

export default function LoginView() {
  return (
    <Login
      onLogin={async (formData) => {
        console.log('Login attempt:', formData)
      }}
      onMagicLinkRequest={async (formData) => {
        console.log('Magic link request:', formData)
      }}
      onOAuthLogin={async (provider) => {
        console.log('OAuth login:', provider)
      }}
      onNavigateToRegister={() => {
        console.log('Navigate to register')
      }}
      onNavigateToPasswordReset={() => {
        console.log('Navigate to password reset')
      }}
      isLoading={false}
      error={null}
      oauthProviders={data.oauthProviders as OAuthProvider[]}
    />
  )
}
