import { useState } from 'react'
import type {
  PasswordResetRequestProps,
} from '../types'

export function PasswordResetRequest({
  onPasswordResetRequest,
  onNavigateToLogin,
  isLoading = false,
  error = null,
}: PasswordResetRequestProps) {
  const [email, setEmail] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await onPasswordResetRequest({ email })
      setIsSuccess(true)
    } catch (err) {
      // Error will be handled by parent component via error prop
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Atmospheric visual */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-zinc-950 overflow-hidden">
        {/* Hero background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/images/hero/auth-hero.png)' }}
        />

        {/* Gradient mesh overlay */}
        <div
          className="absolute inset-0 opacity-40 mix-blend-overlay bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/images/patterns/gradient-mesh-dark.png)' }}
        />

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

          {!isSuccess ? (
            <>
              {/* Header */}
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
                  Reset your password
                </h2>
                <p className="text-zinc-500 dark:text-zinc-400">
                  Enter your email and we'll send you instructions to reset your password
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
                {/* Email field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    disabled={isLoading}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-amber-500/25 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Sending instructions...</span>
                    </>
                  ) : (
                    <span>Send reset instructions</span>
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
            </>
          ) : (
            <>
              {/* Success state */}
              <div className="text-center">
                {/* Success icon */}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/20 mb-6">
                  <svg className="w-8 h-8 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>

                {/* Success message */}
                <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-3">
                  Check your email
                </h2>
                <p className="text-zinc-600 dark:text-zinc-300 mb-2">
                  We've sent password reset instructions to
                </p>
                <p className="text-amber-600 dark:text-amber-400 font-medium mb-8">
                  {email}
                </p>

                {/* Instructions */}
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 mb-8 text-left">
                  <div className="flex gap-3">
                    <svg className="w-5 h-5 text-zinc-400 dark:text-zinc-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
                      <p>Click the link in the email to create a new password.</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-500">
                        The link will expire in 1 hour for security reasons.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Resend button */}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 mb-6 disabled:opacity-50"
                >
                  Didn't receive it? Send again
                </button>

                {/* Back to login */}
                <div className="pt-6 border-t border-zinc-200 dark:border-zinc-700">
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
            </>
          )}
        </div>
      </div>
    </div>
  )
}
