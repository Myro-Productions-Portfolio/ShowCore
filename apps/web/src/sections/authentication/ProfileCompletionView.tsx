import { useState } from 'react'
import { ProfileCompletion } from './components'
import type { UserRole, ProfileCompletionData } from './types'

export default function ProfileCompletionView() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<{ code: string; message: string } | null>(null)
  const [selectedRole, setSelectedRole] = useState<UserRole>('technician')

  const handleCompleteProfile = async (data: ProfileCompletionData) => {
    setIsLoading(true)
    setError(null)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))

    console.log('Profile completion data:', data)

    setIsLoading(false)
    alert('Profile completed successfully!')
  }

  const handleLogout = () => {
    console.log('Logout clicked')
    alert('Logout functionality would redirect to login screen')
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Role switcher for preview */}
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-700 p-3">
          <div className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
            Preview as:
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSelectedRole('technician')
                setError(null)
              }}
              className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                selectedRole === 'technician'
                  ? 'bg-amber-500 text-white'
                  : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600'
              }`}
            >
              Technician
            </button>
            <button
              onClick={() => {
                setSelectedRole('company')
                setError(null)
              }}
              className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                selectedRole === 'company'
                  ? 'bg-amber-500 text-white'
                  : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600'
              }`}
            >
              Company
            </button>
          </div>
          <button
            onClick={() => {
              setError({
                code: 'validation_error',
                message: 'Please complete all required fields before continuing.',
              })
            }}
            className="w-full mt-2 px-3 py-1.5 text-xs rounded-lg bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/30"
          >
            Trigger Error
          </button>
        </div>
      </div>

      <ProfileCompletion
        role={selectedRole}
        onCompleteProfile={handleCompleteProfile}
        onLogout={handleLogout}
        isLoading={isLoading}
        error={error}
      />
    </div>
  )
}
