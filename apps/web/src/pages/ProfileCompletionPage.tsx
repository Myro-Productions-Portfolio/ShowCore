import { useNavigate, useSearchParams } from 'react-router-dom'
import { ProfileCompletion } from '@/sections/authentication/components'
import type { ProfileCompletionData, UserRole } from '@/sections/authentication/types'

export function ProfileCompletionPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  // TODO: Get role from auth context or URL params
  const role = (searchParams.get('role') as UserRole) || 'technician'

  const handleCompleteProfile = async (formData: ProfileCompletionData) => {
    console.log('Complete profile:', formData)
    // TODO: Implement actual profile completion logic
    // After successful completion, navigate to dashboard
    navigate('/')
  }

  const handleLogout = () => {
    console.log('Logout')
    navigate('/login')
    // TODO: Implement actual logout logic
  }

  return (
    <ProfileCompletion
      role={role}
      onCompleteProfile={handleCompleteProfile}
      onLogout={handleLogout}
      isLoading={false}
      error={null}
    />
  )
}