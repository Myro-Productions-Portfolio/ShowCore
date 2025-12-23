import { useState } from 'react'
import { SettingsLayout, ProfileSettings } from '@/sections/settings/components'
import type { SettingsSectionId, SettingsProfile, ProfileUpdateData, SettingsNavigationGroup } from '@/sections/settings/types'
import sampleData from '@/sections/settings/data.json'

export function SettingsPage() {
  const [currentSection, setCurrentSection] = useState<SettingsSectionId>('profile')
  const [currentRole, setCurrentRole] = useState<'technician' | 'company'>('technician')

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

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Settings</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">Manage your account preferences</p>
          </div>
          <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
            <button
              onClick={() => { setCurrentRole('technician'); setCurrentSection('profile') }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${currentRole === 'technician' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
            >
              Technician
            </button>
            <button
              onClick={() => { setCurrentRole('company'); setCurrentSection('profile') }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${currentRole === 'company' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
            >
              Company
            </button>
          </div>
        </div>
      </div>

      <SettingsLayout currentSection={currentSection} navigationGroups={navigationGroups} onNavigate={setCurrentSection}>
        {currentSection === 'profile' && (
          <ProfileSettings profile={profile} onUpdateProfile={handleUpdateProfile} onUploadPhoto={handleUploadPhoto} />
        )}
        {currentSection !== 'profile' && (
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
