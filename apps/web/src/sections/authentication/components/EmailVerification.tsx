import type { EmailVerificationProps } from '../types'

export function EmailVerification({
  email,
  onResendVerification,
  onLogout,
  isLoading = false,
  error = null,
}: EmailVerificationProps) {
  return (
    <main className="min-h-screen flex">
      {/* Left side - Hero image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-zinc-950 overflow-hidden">
        {/* Hero image */}
        <img
          src="/images/hero/auth-hero.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Gradient mesh overlay */}
        <img
          src="/images/patterns/gradient-mesh-dark.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay"
        />

        {/* Dark overlay for better text contrast */}
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
              Check your inbox
              <span className="block text-amber-400">and verify your email.</span>
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed">
              We've sent you a verification link to confirm your account.
              Click the link to get started.
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

      {/* Right side - Verification content */}
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

          {/* Card content */}
          <div>
          {/* Success icon with animation */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              {/* Pulsing background */}
              <div className="absolute inset-0 bg-amber-400/20 dark:bg-amber-500/20 rounded-full blur-xl animate-pulse" />

              {/* Envelope icon */}
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>

                {/* Checkmark overlay */}
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center border-2 border-white dark:border-zinc-900">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-3">
              Verify your email
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              We've sent a verification link to
            </p>
            <p className="text-amber-800 dark:text-amber-100 font-medium mt-1 break-all">
              {email}
            </p>
          </div>

          {/* Instructions */}
          <div className="mb-8 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-amber-800 dark:text-amber-100 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-amber-800 dark:text-amber-100">
                <p className="font-medium mb-1">Check your inbox</p>
                <p className="text-amber-800 dark:text-amber-100">
                  Click the link in the email to verify your account. If you don't see it, check your spam folder.
                </p>
              </div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-700 dark:text-red-300">{error.message}</p>
              </div>
            </div>
          )}

          {/* Resend button */}
          <button
            type="button"
            onClick={onResendVerification}
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-amber-500/25 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                <span>Resend verification email</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-200 dark:border-zinc-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400">
                Or
              </span>
            </div>
          </div>

          {/* Logout button */}
          <button
            type="button"
            onClick={onLogout}
            className="w-full py-3 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            <span>Sign out</span>
          </button>

          {/* Help text */}
          <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Having trouble?{' '}
            <a href="mailto:support@showcore.com" className="font-medium text-amber-800 dark:text-amber-100 hover:text-amber-900 dark:hover:text-amber-50">
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  </main>
  )
}
