import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClerk } from '@clerk/clerk-react'

export default function SSOCallbackPage() {
  const navigate = useNavigate()
  const { handleRedirectCallback } = useClerk()

  useEffect(() => {
    async function handleCallback() {
      try {
        await handleRedirectCallback()
        // Redirect will be handled by Clerk based on redirectUrlComplete
      } catch (error) {
        console.error('SSO callback error:', error)
        navigate('/login?error=sso_failed')
      }
    }

    handleCallback()
  }, [handleRedirectCallback, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-900">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-zinc-600 dark:text-zinc-400">Completing sign in...</p>
      </div>
    </div>
  )
}
