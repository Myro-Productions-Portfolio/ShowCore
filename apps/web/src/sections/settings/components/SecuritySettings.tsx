import { useState } from 'react'
import type {
  SecuritySettingsProps,
  PasswordChangeData,
  ActiveSession,
} from '../types'

export function SecuritySettings({
  securitySettings,
  onChangePassword,
  onEnable2FA,
  onDisable2FA,
  onRevokeSession,
  isLoading = false,
  error = null,
}: SecuritySettingsProps) {
  const [passwordData, setPasswordData] = useState<PasswordChangeData>({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [showBackupCodes, setShowBackupCodes] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false)

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsChangingPassword(true)
    setPasswordChangeSuccess(false)

    try {
      await onChangePassword(passwordData)
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      })
      setPasswordChangeSuccess(true)
      setTimeout(() => setPasswordChangeSuccess(false), 3000)
    } catch (err) {
      // Error handled by parent
    } finally {
      setIsChangingPassword(false)
    }
  }

  const passwordRequirements = [
    { label: 'At least 8 characters', met: passwordData.newPassword.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(passwordData.newPassword) },
    { label: 'One lowercase letter', met: /[a-z]/.test(passwordData.newPassword) },
    { label: 'One number', met: /[0-9]/.test(passwordData.newPassword) },
    { label: 'One special character', met: /[^A-Za-z0-9]/.test(passwordData.newPassword) },
  ]

  const allRequirementsMet = passwordRequirements.every(req => req.met)
  const passwordsMatch = passwordData.newPassword === passwordData.confirmNewPassword
  const canSubmitPassword = allRequirementsMet && passwordsMatch && passwordData.currentPassword && passwordData.newPassword

  const lastPasswordChange = new Date(securitySettings.lastPasswordChange)
  const daysSinceChange = Math.floor((Date.now() - lastPasswordChange.getTime()) / (1000 * 60 * 60 * 24))

  return (
    <div className="max-w-4xl mx-auto p-6 sm:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
          Security
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Manage your password, two-factor authentication, and active sessions
        </p>
      </div>

      {/* Global error */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Success message */}
      {passwordChangeSuccess && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-amber-800 dark:text-amber-100 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-amber-800 dark:text-amber-100">Password changed successfully</p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Change Password Section */}
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">
                Change Password
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Last changed {daysSinceChange} days ago
              </p>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            {/* Current Password */}
            <div>
              <label htmlFor="current-password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Current Password
              </label>
              <div className="relative">
                <input
                  id="current-password"
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  placeholder="Current password"
                  required
                  disabled={isChangingPassword}
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  {showPasswords.current ? (
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
            </div>

            {/* New Password */}
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="New password"
                  required
                  disabled={isChangingPassword}
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  {showPasswords.new ? (
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

              {/* Password Requirements */}
              {passwordData.newPassword && (
                <div className="mt-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700">
                  <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">Password must contain:</p>
                  <div className="space-y-1">
                    {passwordRequirements.map((req, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        {req.met ? (
                          <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-zinc-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                        <span className={`text-xs ${req.met ? 'text-green-700 dark:text-green-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
                          {req.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwordData.confirmNewPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })}
                  placeholder="Confirm password"
                  required
                  disabled={isChangingPassword}
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  {showPasswords.confirm ? (
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
              {passwordData.confirmNewPassword && !passwordsMatch && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">Passwords do not match</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={!canSubmitPassword || isChangingPassword}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-amber-500/25"
              >
                {isChangingPassword ? 'Changing Password...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>

        {/* Two-Factor Authentication Section */}
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                  Two-Factor Authentication
                </h2>
                {securitySettings.twoFactorAuth.enabled && (
                  <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium">
                    Enabled
                  </span>
                )}
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Add an extra layer of security to your account
              </p>
            </div>
          </div>

          {securitySettings.twoFactorAuth.enabled ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <svg className="w-5 h-5 text-amber-800 dark:text-amber-100 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                    {securitySettings.twoFactorAuth.method === 'authenticator' ? 'Authenticator App' : 'SMS'}
                  </p>
                  <p className="text-xs text-amber-800 dark:text-amber-100">
                    2FA is protecting your account
                  </p>
                </div>
              </div>

              {/* Backup Codes */}
              {securitySettings.twoFactorAuth.backupCodes && securitySettings.twoFactorAuth.backupCodes.length > 0 && (
                <div>
                  <button
                    type="button"
                    onClick={() => setShowBackupCodes(!showBackupCodes)}
                    className="flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-100 hover:text-amber-900 dark:hover:text-amber-50"
                  >
                    {showBackupCodes ? (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                        Hide Backup Codes
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Backup Codes
                      </>
                    )}
                  </button>

                  {showBackupCodes && (
                    <div className="mt-3 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700">
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3">
                        Save these backup codes in a secure location. Each code can only be used once.
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {securitySettings.twoFactorAuth.backupCodes.map((code, idx) => (
                          <div key={idx} className="font-mono text-sm text-zinc-900 dark:text-white bg-white dark:bg-zinc-800 px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700">
                            {code}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => onDisable2FA()}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Disable 2FA
                </button>
                <button
                  type="button"
                  onClick={() => console.log('Regenerate backup codes')}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Regenerate Codes
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Two-factor authentication is not enabled. Enable it to add an extra layer of security to your account.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => onEnable2FA('authenticator')}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Enable with Authenticator App
                </button>
                <button
                  type="button"
                  onClick={() => onEnable2FA('sms')}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Enable with SMS
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Active Sessions Section */}
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">
                Active Sessions
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Manage devices where you're currently signed in
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {securitySettings.activeSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onRevoke={onRevokeSession}
                isLoading={isLoading}
              />
            ))}
          </div>

          {securitySettings.activeSessions.filter(s => !s.isCurrent).length > 0 && (
            <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-700">
              <button
                type="button"
                onClick={() => {
                  securitySettings.activeSessions
                    .filter(s => !s.isCurrent)
                    .forEach(s => onRevokeSession(s.id))
                }}
                disabled={isLoading}
                className="text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sign out all other sessions
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SessionCard({
  session,
  onRevoke,
  isLoading,
}: {
  session: ActiveSession
  onRevoke: (sessionId: string) => Promise<void>
  isLoading?: boolean
}) {
  const getDeviceIcon = (type: ActiveSession['deviceType']) => {
    switch (type) {
      case 'desktop':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        )
      case 'mobile':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        )
      case 'tablet':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        )
    }
  }

  const formatLastActive = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Active now'
    if (diffMins < 60) return `${diffMins}m ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`

    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  return (
    <div className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
      session.isCurrent
        ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
        : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700'
    }`}>
      <div className={`p-2 rounded-lg ${
        session.isCurrent
          ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-100'
          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
      }`}>
        {getDeviceIcon(session.deviceType)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-zinc-900 dark:text-white">
                {session.deviceName}
              </h3>
              {session.isCurrent && (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-100 text-xs font-medium">
                  Current
                </span>
              )}
            </div>
            <div className="text-sm text-zinc-500 dark:text-zinc-400 space-y-0.5">
              <p>{session.browser}</p>
              <p>{session.location} · {session.ipAddress}</p>
              <p>{formatLastActive(session.lastActive)}</p>
            </div>
          </div>

          {!session.isCurrent && (
            <button
              type="button"
              onClick={() => onRevoke(session.id)}
              disabled={isLoading}
              className="text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              Revoke
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
