import { useNavigate } from 'react-router-dom'
import { EmailVerification } from '@/sections/authentication/components'

export function EmailVerificationPage() {
  const navigate = useNavigate()
  
  // TODO: Get email from auth context or URL params
  const email = 'user@example.com'

  const handleResendVerification = async () => {
    console.log('Resend verification email')
    // TODO: Implement actual resend verification logic
  }

  const handleLogout = () => {
    console.log('Logout')
    navigate('/login')
    // TODO: Implement actual logout logic
  }

  return (
    <EmailVerification
      email={email}
      onResendVerification={handleResendVerification}
      onLogout={handleLogout}
      isLoading={false}
      error={null}
    />
  )
}