import { useState } from 'react'
import type {
  PasswordResetProps,
} from '../types'

type PasswordStrength = 'weak' | 'medium' | 'strong'

export function PasswordReset({
  token,
  onPasswordReset,
  onNavigateToLogin,
  isLoading = false,
  error = null,
}: PasswordResetProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Calculate password strength
  const getPasswordStrength = (pwd: string): PasswordStrength => {
    if (pwd.length < 6) return 'weak'

    const hasUpper = /[A-Z]/.test(pwd)
    const hasLower = /[a-z]/.test(pwd)
    const hasNumber = /\d/.test(pwd)
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pwd)
    const isLongEnough = pwd.length >= 8

    const criteriaMet = [hasUpper, hasLower, hasNumber, hasSpecial, isLongEnough].filter(Boolean).length

    if (criteriaMet >= 4) return 'strong'
    if (criteriaMet >= 2) return 'medium'
    return 'weak'
  }

  const passwordStrength = password ? getPasswordStrength(password) : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      return
    }
    await onPasswordReset({ password, confirmPassword, token })
  }

  const passwordsMatch = password && confirmPassword && password === confirmPassword

  return (
    <main className="min-h-screen flex">
      {/* Left side - Atmospheric visual */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-zinc-950 overflow-hidden">
        {/* Hero image background */}
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(/images/hero/auth-hero.png)' }} />

        {/* Gradient mesh overlay */}
        <div className="absolute inset-0 opacity-40 mix-blend-overlay" style={{ backgroundImage: 'url(/images/patterns/gradient-mesh-dark.png)' }} />

        {/* Dark overlay for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-950/70 via-zinc-950/50 to-zinc-950/70" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-zinc-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 1-6.23.693L4.2 15.3m15.6 0-.3 1.79a2.25 2.25 0 0 1-1.406 1.704l-1.878.626a9.02 9.02 0 0 1-5.732 0l-1.878-.626a2.25 2.25 0 0 1-1.406-1.704l-.3-1.79" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">ShowCore</span>
          </div>

          {/* Tagline */}
          <div className="max-w-md">
            <h1 className="text-5xl font-bold text-white leading-tight mb-6">
              Where talent
              <span className="block text-amber-400">meets opportunity.</span>
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed">
              Connect with top AV technicians and production companies.
              Book with confidence, work with the best.
            </p>
          </div>

          {/* Stats */}
          <div className="flex gap-12">
            <div>
              <div className="text-4xl font-bold text-white">2,500+</div>
              <div className="text-zinc-500 text-sm uppercase tracking-wider mt-1">Technicians</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white">850+</div>
              <div className="text-zinc-500 text-sm uppercase tracking-wider mt-1">Companies</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white">15K+</div>
              <div className="text-zinc-500 text-sm uppercase tracking-wider mt-1">Shows Booked</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Reset form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white dark:bg-zinc-900">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-zinc-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 1-6.23.693L4.2 15.3m15.6 0-.3 1.79a2.25 2.25 0 0 1-1.406 1.704l-1.878.626a9.02 9.02 0 0 1-5.732 0l-1.878-.626a2.25 2.25 0 0 1-1.406-1.704l-.3-1.79" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">ShowCore</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
              Create new password
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400">
              Choose a strong password for your account
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-700 dark:text-red-300">{error.message}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New password field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                New password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your new password"
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Password strength indicator */}
              {password && passwordStrength && (
                <div className="mt-3 space-y-2">
                  <div className="flex gap-1.5">
                    <div className={`h-1.5 flex-1 rounded-full transition-colors ${
                      passwordStrength === 'weak' ? 'bg-red-500' :
                      passwordStrength === 'medium' ? 'bg-amber-500' :
                      'bg-green-500'
                    }`} />
                    <div className={`h-1.5 flex-1 rounded-full transition-colors ${
                      passwordStrength === 'medium' || passwordStrength === 'strong' ?
                        passwordStrength === 'medium' ? 'bg-amber-500' : 'bg-green-500' :
                        'bg-zinc-200 dark:bg-zinc-700'
                    }`} />
                    <div className={`h-1.5 flex-1 rounded-full transition-colors ${
                      passwordStrength === 'strong' ? 'bg-green-500' : 'bg-zinc-200 dark:bg-zinc-700'
                    }`} />
                  </div>
                  <p className={`text-xs font-medium ${
                    passwordStrength === 'weak' ? 'text-red-600 dark:text-red-400' :
                    passwordStrength === 'medium' ? 'text-amber-800 dark:text-amber-100' :
                    'text-green-600 dark:text-green-400'
                  }`}>
                    Password strength: {passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)}
                  </p>

                  {/* Password requirements */}
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
                    <p>Use at least:</p>
                    <ul className="space-y-0.5 ml-4">
                      <li className={password.length >= 8 ? 'text-green-600 dark:text-green-400' : ''}>
                        {password.length >= 8 ? '✓' : '•'} 8 characters
                      </li>
                      <li className={/[A-Z]/.test(password) ? 'text-green-600 dark:text-green-400' : ''}>
                        {/[A-Z]/.test(password) ? '✓' : '•'} One uppercase letter
                      </li>
                      <li className={/[a-z]/.test(password) ? 'text-green-600 dark:text-green-400' : ''}>
                        {/[a-z]/.test(password) ? '✓' : '•'} One lowercase letter
                      </li>
                      <li className={/\d/.test(password) ? 'text-green-600 dark:text-green-400' : ''}>
                        {/\d/.test(password) ? '✓' : '•'} One number
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm password field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Confirm password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  {showConfirmPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Password match indicator */}
              {confirmPassword && (
                <p className={`mt-2 text-xs font-medium ${
                  passwordsMatch ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                </p>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading || !passwordsMatch || !password}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-amber-500/25 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Resetting password...</span>
                </>
              ) : (
                <span>Reset password</span>
              )}
            </button>
          </form>

          {/* Back to login */}
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => onNavigateToLogin()}
              className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to login
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
