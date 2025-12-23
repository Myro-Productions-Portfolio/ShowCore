import { useState } from 'react';
import type { PrivacySettingsProps, PrivacySettings as PrivacySettingsType } from '../types';

export function PrivacySettings({
  privacySettings,
  onUpdatePrivacy,
  isLoading = false,
  error = null,
}: PrivacySettingsProps) {
  const [settings, setSettings] = useState<PrivacySettingsType>(privacySettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field: keyof PrivacySettingsType, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdatePrivacy(settings);
      setHasChanges(false);
    } catch (err) {
      // Error handled by parent
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(privacySettings);
    setHasChanges(false);
  };

  return (
    <div className="max-w-3xl space-y-8">
      {/* Main Card with Orange Border and Fill */}
      <div className="rounded-xl border-2 border-amber-500 dark:border-amber-600 bg-amber-50/50 dark:bg-amber-950/20 p-6 sm:p-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
            Privacy Settings
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Control who can see your information and how your data is used.
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-4 border border-red-200 dark:border-red-900 mb-8">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <div className="space-y-8">
        {/* Profile Visibility */}
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-medium text-zinc-900 dark:text-white">
              Profile Visibility
            </h3>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Control who can see your profile in search results.
            </p>
          </div>

          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="radio"
                name="profileVisibility"
                checked={settings.profileVisibility === 'public'}
                onChange={() => handleChange('profileVisibility', 'public')}
                className="mt-0.5 h-4 w-4 text-amber-500 border-zinc-300 dark:border-zinc-600 focus:ring-amber-500 dark:focus:ring-amber-400"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-zinc-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400">
                  Public
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  Anyone can find and view your profile
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="radio"
                name="profileVisibility"
                checked={settings.profileVisibility === 'private'}
                onChange={() => handleChange('profileVisibility', 'private')}
                className="mt-0.5 h-4 w-4 text-amber-500 border-zinc-300 dark:border-zinc-600 focus:ring-amber-500 dark:focus:ring-amber-400"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-zinc-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400">
                  Private
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  Only you can see your profile
                </div>
              </div>
            </label>
          </div>
        </div>

        <div className="border-t border-zinc-200 dark:border-zinc-700" />

        {/* Contact Information Visibility */}
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-medium text-zinc-900 dark:text-white">
              Contact Information
            </h3>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Choose who can see your contact details.
            </p>
          </div>

          {/* Email Visibility */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-zinc-900 dark:text-white">
              Email Address
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="emailVisibility"
                  checked={settings.emailVisibility === 'public'}
                  onChange={() => handleChange('emailVisibility', 'public')}
                  className="h-4 w-4 text-amber-500 border-zinc-300 dark:border-zinc-600 focus:ring-amber-500 dark:focus:ring-amber-400"
                />
                <span className="text-sm text-zinc-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400">
                  Public
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="emailVisibility"
                  checked={settings.emailVisibility === 'connections'}
                  onChange={() => handleChange('emailVisibility', 'connections')}
                  className="h-4 w-4 text-amber-500 border-zinc-300 dark:border-zinc-600 focus:ring-amber-500 dark:focus:ring-amber-400"
                />
                <span className="text-sm text-zinc-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400">
                  Connections only
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="emailVisibility"
                  checked={settings.emailVisibility === 'private'}
                  onChange={() => handleChange('emailVisibility', 'private')}
                  className="h-4 w-4 text-amber-500 border-zinc-300 dark:border-zinc-600 focus:ring-amber-500 dark:focus:ring-amber-400"
                />
                <span className="text-sm text-zinc-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400">
                  Private
                </span>
              </label>
            </div>
          </div>

          {/* Phone Visibility */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-zinc-900 dark:text-white">
              Phone Number
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="phoneVisibility"
                  checked={settings.phoneVisibility === 'public'}
                  onChange={() => handleChange('phoneVisibility', 'public')}
                  className="h-4 w-4 text-amber-500 border-zinc-300 dark:border-zinc-600 focus:ring-amber-500 dark:focus:ring-amber-400"
                />
                <span className="text-sm text-zinc-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400">
                  Public
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="phoneVisibility"
                  checked={settings.phoneVisibility === 'connections'}
                  onChange={() => handleChange('phoneVisibility', 'connections')}
                  className="h-4 w-4 text-amber-500 border-zinc-300 dark:border-zinc-600 focus:ring-amber-500 dark:focus:ring-amber-400"
                />
                <span className="text-sm text-zinc-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400">
                  Connections only
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="phoneVisibility"
                  checked={settings.phoneVisibility === 'private'}
                  onChange={() => handleChange('phoneVisibility', 'private')}
                  className="h-4 w-4 text-amber-500 border-zinc-300 dark:border-zinc-600 focus:ring-amber-500 dark:focus:ring-amber-400"
                />
                <span className="text-sm text-zinc-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400">
                  Private
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-200 dark:border-zinc-700" />

        {/* Data Sharing Preferences */}
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-medium text-zinc-900 dark:text-white">
              Data Sharing
            </h3>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Help us improve by sharing anonymized usage data.
            </p>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer group">
              <div className="flex-1 pr-4">
                <div className="text-sm font-medium text-zinc-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400">
                  Allow data sharing
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  Share anonymized data to help improve the platform
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.allowDataSharing}
                onClick={() => handleChange('allowDataSharing', !settings.allowDataSharing)}
                className={`
                  relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent
                  transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2
                  focus:ring-amber-500 dark:focus:ring-amber-400 focus:ring-offset-2
                  ${settings.allowDataSharing
                    ? 'bg-amber-500 dark:bg-amber-400'
                    : 'bg-zinc-200 dark:bg-zinc-700'
                  }
                `}
              >
                <span
                  className={`
                    pointer-events-none inline-block h-5 w-5 transform rounded-full
                    bg-white shadow ring-0 transition duration-200 ease-in-out
                    ${settings.allowDataSharing ? 'translate-x-5' : 'translate-x-0'}
                  `}
                />
              </button>
            </label>

            <label className="flex items-center justify-between cursor-pointer group">
              <div className="flex-1 pr-4">
                <div className="text-sm font-medium text-zinc-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400">
                  Marketing communications
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  Receive updates about new features and platform news
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.allowMarketingCommunications}
                onClick={() => handleChange('allowMarketingCommunications', !settings.allowMarketingCommunications)}
                className={`
                  relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent
                  transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2
                  focus:ring-amber-500 dark:focus:ring-amber-400 focus:ring-offset-2
                  ${settings.allowMarketingCommunications
                    ? 'bg-amber-500 dark:bg-amber-400'
                    : 'bg-zinc-200 dark:bg-zinc-700'
                  }
                `}
              >
                <span
                  className={`
                    pointer-events-none inline-block h-5 w-5 transform rounded-full
                    bg-white shadow ring-0 transition duration-200 ease-in-out
                    ${settings.allowMarketingCommunications ? 'translate-x-5' : 'translate-x-0'}
                  `}
                />
              </button>
            </label>
          </div>
        </div>
        </div>

        {/* Action Buttons */}
        {hasChanges && (
          <div className="flex items-center gap-3 pt-6 border-t border-zinc-200 dark:border-zinc-700">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 dark:bg-amber-400 dark:hover:bg-amber-500
                text-white dark:text-zinc-900 rounded-lg font-medium text-sm transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={isSaving || isLoading}
              className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700
                text-zinc-900 dark:text-white rounded-lg font-medium text-sm transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
