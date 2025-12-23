import { useNavigate } from 'react-router-dom'
import { PasswordResetRequest } from '@/sections/authentication/components'
import type { PasswordResetRequestData } from '@/sections/authentication/types'

export function PasswordResetRequestPage() {
  const navigate = useNavigate()

  const handlePasswordResetRequest = async (formData: PasswordResetRequestData) => {
    console.log('Password reset request:', formData)
    // TODO: Implement actual password reset request logic
  }

  const handleNavigateToLogin = () => {
    navigate('/login')
  }

  return (
    <PasswordResetRequest
      onPasswordResetRequest={handlePasswordResetRequest}
      onNavigateToLogin={handleNavigateToLogin}
      isLoading={false}
      error={null}
    />
  )
}