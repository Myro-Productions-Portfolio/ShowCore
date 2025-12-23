import { useState } from 'react'
import { SettingsLayout, ProfileSettings } from './components'
import type {
  SettingsSectionId,
  SettingsProfile,
  ProfileUpdateData,
  SettingsNavigationGroup,
} from '../types'
import sampleData from '../data.json'

export default function SettingsView() {
  const [currentSection, setCurrentSection] = useState<SettingsSectionId>('profile')
  const [currentRole, setCurrentRole] = useState<'technician' | 'company'>('technician')

  // Get profile based on current role
  const profile: SettingsProfile =
    currentRole === 'technician'
      ? (sampleData.technicianProfile as SettingsProfile)
      : (sampleData.companyProfile as SettingsProfile)

  // Get navigation groups based on role
  const navigationGroups: SettingsNavigationGroup[] =
    currentRole === 'technician'
      ? (sampleData.settingsNavigation.technician as SettingsNavigationGroup[])
      : (sampleData.settingsNavigation.company as SettingsNavigationGroup[])

  // Mock handlers
  const handleUpdateProfile = async (data: ProfileUpdateData) => {
    console.log('Update profile:', data)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const handleUploadPhoto = async (file: File) => {
    console.log('Upload photo:', file.name)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    return URL.createObjectURL(file)
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Preview controls */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Settings Preview</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">
              Switch between roles to preview different settings layouts
            </p>
          </div>
          <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
            <button
              onClick={() => {
                setCurrentRole('technician')
                setCurrentSection('profile')
              }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                currentRole === 'technician'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              Technician
            </button>
            <button
              onClick={() => {
                setCurrentRole('company')
                setCurrentSection('profile')
              }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                currentRole === 'company'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              Company
            </button>
          </div>
        </div>
      </div>

      {/* Settings layout */}
      <SettingsLayout
        currentSection={currentSection}
        navigationGroups={navigationGroups}
        onNavigate={setCurrentSection}
      >
        {/* Render section based on currentSection */}
        {currentSection === 'profile' && (
          <ProfileSettings
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
            onUploadPhoto={handleUploadPhoto}
          />
        )}

        {/* Placeholder for other sections */}
        {currentSection !== 'profile' && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-zinc-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                Section Coming Soon
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                The{' '}
                <span className="font-medium">
                  {navigationGroups
                    .flatMap((g) => g.sections)
                    .find((s) => s.id === currentSection)?.label}
                </span>{' '}
                section is not yet implemented in this preview.
              </p>
            </div>
          </div>
        )}
      </SettingsLayout>
    </div>
  )
}
