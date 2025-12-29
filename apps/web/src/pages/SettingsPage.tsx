import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { SettingsLayout, ProfileSettings, SecuritySettings, NotificationSettings, PayoutSettings, BillingSettings, PrivacySettings, AppearanceSettings, ConnectedAccountsSettings, AccountSettings } from '@/sections/settings/components'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useTheme } from '@/hooks/useTheme'
import { useTranslation } from 'react-i18next'
import type { SettingsSectionId, SettingsProfile, ProfileUpdateData, SettingsNavigationGroup, SecuritySettings as SecuritySettingsType, PasswordChangeData, NotificationPreferences, PayoutMethod, BankAccountFormData, PayPalFormData, BillingInfo, PaymentMethodFormData, PrivacySettings as PrivacySettingsType, AppearanceSettings as AppearanceSettingsType, ConnectedAccount, AccountManagement, CompanyTier, BillingAddress } from '@/sections/settings/types'
import sampleData from '@/sections/settings/data.json'

// Valid section IDs that can be used in the URL
const validSections: SettingsSectionId[] = ['profile', 'security', 'notifications', 'payment', 'billing', 'privacy', 'appearance', 'connected-accounts', 'account']

export default function SettingsPage() {
  const { section: urlSection } = useParams<{ section?: string }>()
  const navigate = useNavigate()
  const [currentSection, setCurrentSection] = useLocalStorage<SettingsSectionId>('showcore_settings_section', 'profile')
  const [currentRole, setCurrentRole] = useLocalStorage<'technician' | 'company'>('showcore_settings_role', 'technician')

  // Sync URL section parameter with currentSection state
  useEffect(() => {
    if (urlSection && validSections.includes(urlSection as SettingsSectionId)) {
      setCurrentSection(urlSection as SettingsSectionId)
    }
  }, [urlSection, setCurrentSection])

  // Handle navigation - update URL when section changes via sidebar
  const handleNavigate = (sectionId: SettingsSectionId) => {
    setCurrentSection(sectionId)
    navigate(`/settings/${sectionId}`, { replace: true })
  }
  const { theme, fontSize, language } = useTheme()
  const { t } = useTranslation('settings')

  const profile: SettingsProfile = currentRole === 'technician'
    ? (sampleData.technicianProfile as SettingsProfile)
    : (sampleData.companyProfile as SettingsProfile)

  const navigationGroups: SettingsNavigationGroup[] = currentRole === 'technician'
    ? (sampleData.settingsNavigation.technician as SettingsNavigationGroup[])
    : (sampleData.settingsNavigation.company as SettingsNavigationGroup[])

  const handleUpdateProfile = async (data: ProfileUpdateData) => {
    console.log('Update profile:', data)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const handleUploadPhoto = async (file: File) => {
    console.log('Upload photo:', file.name)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    return URL.createObjectURL(file)
  }

  const handleChangePassword = async (data: PasswordChangeData) => {
    console.log('Change password:', data)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const handleEnable2FA = async (method: 'sms' | 'authenticator') => {
    console.log('Enable 2FA with method:', method)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const handleDisable2FA = async () => {
    console.log('Disable 2FA')
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const handleRevokeSession = async (sessionId: string) => {
    console.log('Revoke session:', sessionId)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const handleUpdateNotifications = async (preferences: NotificationPreferences) => {
    console.log('Update notification preferences:', preferences)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const handleAddBankAccount = async (data: BankAccountFormData) => {
    console.log('Add bank account:', data)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const handleAddPayPal = async (data: PayPalFormData) => {
    console.log('Add PayPal:', data)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const handleRemovePayoutMethod = async (methodId: string) => {
    console.log('Remove payout method:', methodId)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const handleSetDefaultPayoutMethod = async (methodId: string) => {
    console.log('Set default payout method:', methodId)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const handleAddPaymentMethod = async (data: PaymentMethodFormData) => {
    console.log('Add payment method:', data)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const handleRemovePaymentMethod = async (methodId: string) => {
    console.log('Remove payment method:', methodId)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const handleSetDefaultPaymentMethod = async (methodId: string) => {
    console.log('Set default payment method:', methodId)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const handleUpdateBillingAddress = async (address: BillingAddress) => {
    console.log('Update billing address:', address)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const handleUpgradeTier = async (tier: CompanyTier) => {
    console.log('Upgrade tier:', tier)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const handleDownloadInvoice = async (invoiceId: string) => {
    console.log('Download invoice:', invoiceId)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const handleUpdatePrivacy = async (settings: PrivacySettingsType) => {
    console.log('Update privacy settings:', settings)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const handleUpdateAppearance = async (settings: AppearanceSettingsType) => {
    console.log('Update appearance settings:', settings)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const handleConnectAccount = async (provider: 'google' | 'apple' | 'microsoft') => {
    console.log('Connect account:', provider)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const handleDisconnectAccount = async (accountId: string) => {
    console.log('Disconnect account:', accountId)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const handleExportData = async () => {
    console.log('Export user data')
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }

  const handleDeactivateAccount = async () => {
    console.log('Deactivate account')
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const handleCancelDeactivation = async () => {
    console.log('Cancel deactivation')
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const handleDeleteAccount = async () => {
    console.log('Delete account')
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const handleCancelDeletion = async () => {
    console.log('Cancel deletion')
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="lg:pl-64 xl:pl-72 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8">
        <div className="max-w-[1800px] mb-8">
          <div className="relative bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 dark:from-amber-600 dark:via-amber-700 dark:to-orange-700 rounded-xl p-6 sm:p-8 text-white shadow-lg overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-24 -translate-x-24"></div>
            </div>

            <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold drop-shadow-sm mb-2">
                  {t('title')}
                </h1>
                <p className="text-amber-50 drop-shadow-sm">
                  {t('subtitle')}
                </p>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm p-1 rounded-lg">
                <button
                  onClick={() => { setCurrentRole('technician'); handleNavigate('profile') }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${currentRole === 'technician' ? 'bg-white text-amber-800 shadow-sm' : 'text-white hover:bg-white/10'}`}
                >
                  Technician
                </button>
                <button
                  onClick={() => { setCurrentRole('company'); handleNavigate('profile') }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${currentRole === 'company' ? 'bg-white text-amber-800 shadow-sm' : 'text-white hover:bg-white/10'}`}
                >
                  Company
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SettingsLayout currentSection={currentSection} navigationGroups={navigationGroups} onNavigate={handleNavigate}>
        {currentSection === 'profile' && (
          <ProfileSettings profile={profile} onUpdateProfile={handleUpdateProfile} onUploadPhoto={handleUploadPhoto} />
        )}
        {currentSection === 'security' && (
          <SecuritySettings 
            securitySettings={sampleData.securitySettings as SecuritySettingsType}
            onChangePassword={handleChangePassword}
            onEnable2FA={handleEnable2FA}
            onDisable2FA={handleDisable2FA}
            onRevokeSession={handleRevokeSession}
            isLoading={false}
            error={null}
          />
        )}
        {currentSection === 'notifications' && (
          <NotificationSettings 
            preferences={sampleData.notificationPreferences as NotificationPreferences}
            onUpdatePreferences={handleUpdateNotifications}
            isLoading={false}
            error={null}
          />
        )}
        {currentSection === 'payment' && currentRole === 'technician' && (
          <PayoutSettings 
            payoutMethods={sampleData.samplePayoutMethods as PayoutMethod[]}
            onAddBankAccount={handleAddBankAccount}
            onAddPayPal={handleAddPayPal}
            onRemoveMethod={handleRemovePayoutMethod}
            onSetDefaultMethod={handleSetDefaultPayoutMethod}
            isLoading={false}
            error={null}
          />
        )}
        {currentSection === 'billing' && currentRole === 'company' && (
          <BillingSettings 
            billingInfo={sampleData.sampleBillingInfo as BillingInfo}
            subscriptionTier={(sampleData.companyProfile as any).subscriptionTier}
            onAddPaymentMethod={handleAddPaymentMethod}
            onRemovePaymentMethod={handleRemovePaymentMethod}
            onSetDefaultPaymentMethod={handleSetDefaultPaymentMethod}
            onUpdateBillingAddress={handleUpdateBillingAddress}
            onDownloadInvoice={handleDownloadInvoice}
            onUpgradeTier={handleUpgradeTier}
            isLoading={false}
            error={null}
          />
        )}
        {currentSection === 'privacy' && (
          <PrivacySettings 
            privacySettings={sampleData.privacySettings as PrivacySettingsType}
            onUpdatePrivacy={handleUpdatePrivacy}
            isLoading={false}
            error={null}
          />
        )}
        {currentSection === 'appearance' && (
          <div>
            {/* Debug info - only visible in development */}
            {import.meta.env.DEV && (
              <div className="mb-4 p-4 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">Debug Info:</h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Current theme: {theme} | Font size: {fontSize} | Language: {language}
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  HTML classes: {typeof document !== 'undefined' ? document.documentElement.className : 'N/A'}
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  HTML lang: {typeof document !== 'undefined' ? document.documentElement.getAttribute('lang') : 'N/A'}
                </p>
              </div>
            )}

            <AppearanceSettings 
              appearanceSettings={{
                ...sampleData.appearanceSettings as AppearanceSettingsType,
                theme: theme, // Use actual theme from hook
                fontSize: fontSize, // Use actual font size from hook
                language: language, // Use actual language from hook
              }}
              onUpdateAppearance={handleUpdateAppearance}
              isLoading={false}
              error={null}
            />
          </div>
        )}
        {currentSection === 'connected-accounts' && (
          <ConnectedAccountsSettings 
            connectedAccounts={sampleData.connectedAccounts as ConnectedAccount[]}
            onConnectAccount={handleConnectAccount}
            onDisconnectAccount={handleDisconnectAccount}
            isLoading={false}
            error={null}
          />
        )}
        {currentSection === 'account' && (
          <AccountSettings 
            accountManagement={sampleData.accountManagement as AccountManagement}
            onExportData={handleExportData}
            onDeactivateAccount={handleDeactivateAccount}
            onCancelDeactivation={handleCancelDeactivation}
            onDeleteAccount={handleDeleteAccount}
            onCancelDeletion={handleCancelDeletion}
            isLoading={false}
            error={null}
          />
        )}
        {currentSection !== 'profile' && currentSection !== 'security' && currentSection !== 'notifications' && currentSection !== 'payment' && currentSection !== 'billing' && currentSection !== 'privacy' && currentSection !== 'appearance' && currentSection !== 'connected-accounts' && currentSection !== 'account' && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-12 text-center">
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">Section Coming Soon</h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                The <span className="font-medium">{navigationGroups.flatMap((g) => g.sections).find((s) => s.id === currentSection)?.label}</span> section is not yet implemented.
              </p>
            </div>
          </div>
        )}
      </SettingsLayout>
    </div>
  )
}