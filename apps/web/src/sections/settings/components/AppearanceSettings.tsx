import { useState } from 'react';
import type { AppearanceSettingsProps, AppearanceSettings as AppearanceSettingsType } from '../types';

interface LanguageOption {
  code: string;
  name: string;
}

export function AppearanceSettings({
  appearanceSettings,
  onUpdateAppearance,
  isLoading = false,
  error = null,
}: AppearanceSettingsProps) {
  const [settings, setSettings] = useState<AppearanceSettingsType>(appearanceSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Mock language options (in a real app, this would be passed as a prop or imported)
  const languageOptions: LanguageOption[] = [
    { code: 'en-US', name: 'English (US)' },
    { code: 'en-GB', name: 'English (UK)' },
    { code: 'es-ES', name: 'Spanish' },
    { code: 'fr-FR', name: 'French' },
    { code: 'de-DE', name: 'German' },
    { code: 'it-IT', name: 'Italian' },
    { code: 'pt-BR', name: 'Portuguese (Brazil)' },
    { code: 'ja-JP', name: 'Japanese' },
    { code: 'zh-CN', name: 'Chinese (Simplified)' },
    { code: 'ko-KR', name: 'Korean' },
  ];

  const handleChange = (field: keyof AppearanceSettingsType, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateAppearance(settings);
      setHasChanges(false);
    } catch (err) {
      // Error handled by parent
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(appearanceSettings);
    setHasChanges(false);
  };

  return (
    <div className="max-w-3xl space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
          Appearance Settings
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Customize how the app looks and feels to match your preferences.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-4 border border-red-200 dark:border-red-900">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <div className="space-y-8">
        {/* Theme Selection */}
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-medium text-zinc-900 dark:text-white">
              Theme
            </h3>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Choose your preferred color scheme.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Light Theme */}
            <label className="cursor-pointer group">
              <input
                type="radio"
                name="theme"
                value="light"
                checked={settings.theme === 'light'}
                onChange={() => handleChange('theme', 'light')}
                className="sr-only"
              />
              <div
                className={`
                  relative rounded-lg border-2 transition-all
                  ${settings.theme === 'light'
                    ? 'border-amber-500 dark:border-amber-400 ring-2 ring-amber-500/20 dark:ring-amber-400/20'
                    : 'border-zinc-200 dark:border-zinc-700 group-hover:border-amber-300 dark:group-hover:border-amber-600'
                  }
                `}
              >
                {/* Preview */}
                <div className="p-4 space-y-2">
                  <div className="bg-white rounded border border-zinc-200 p-3 space-y-2">
                    <div className="h-2 bg-amber-500 rounded w-1/2" />
                    <div className="h-1.5 bg-zinc-200 rounded w-3/4" />
                    <div className="h-1.5 bg-zinc-200 rounded w-2/3" />
                  </div>
                  <div className="flex justify-center">
                    <div className="text-xs font-medium text-zinc-900 dark:text-white">
                      Light
                    </div>
                  </div>
                </div>
                {settings.theme === 'light' && (
                  <div className="absolute top-2 right-2 flex items-center justify-center w-5 h-5 bg-amber-500 dark:bg-amber-400 rounded-full">
                    <svg className="w-3 h-3 text-white dark:text-zinc-900" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </label>

            {/* Dark Theme */}
            <label className="cursor-pointer group">
              <input
                type="radio"
                name="theme"
                value="dark"
                checked={settings.theme === 'dark'}
                onChange={() => handleChange('theme', 'dark')}
                className="sr-only"
              />
              <div
                className={`
                  relative rounded-lg border-2 transition-all
                  ${settings.theme === 'dark'
                    ? 'border-amber-500 dark:border-amber-400 ring-2 ring-amber-500/20 dark:ring-amber-400/20'
                    : 'border-zinc-200 dark:border-zinc-700 group-hover:border-amber-300 dark:group-hover:border-amber-600'
                  }
                `}
              >
                {/* Preview */}
                <div className="p-4 space-y-2">
                  <div className="bg-zinc-900 rounded border border-zinc-700 p-3 space-y-2">
                    <div className="h-2 bg-amber-400 rounded w-1/2" />
                    <div className="h-1.5 bg-zinc-700 rounded w-3/4" />
                    <div className="h-1.5 bg-zinc-700 rounded w-2/3" />
                  </div>
                  <div className="flex justify-center">
                    <div className="text-xs font-medium text-zinc-900 dark:text-white">
                      Dark
                    </div>
                  </div>
                </div>
                {settings.theme === 'dark' && (
                  <div className="absolute top-2 right-2 flex items-center justify-center w-5 h-5 bg-amber-500 dark:bg-amber-400 rounded-full">
                    <svg className="w-3 h-3 text-white dark:text-zinc-900" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </label>

            {/* System Theme */}
            <label className="cursor-pointer group">
              <input
                type="radio"
                name="theme"
                value="system"
                checked={settings.theme === 'system'}
                onChange={() => handleChange('theme', 'system')}
                className="sr-only"
              />
              <div
                className={`
                  relative rounded-lg border-2 transition-all
                  ${settings.theme === 'system'
                    ? 'border-amber-500 dark:border-amber-400 ring-2 ring-amber-500/20 dark:ring-amber-400/20'
                    : 'border-zinc-200 dark:border-zinc-700 group-hover:border-amber-300 dark:group-hover:border-amber-600'
                  }
                `}
              >
                {/* Preview */}
                <div className="p-4 space-y-2">
                  <div className="bg-gradient-to-br from-white to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 rounded border border-zinc-300 dark:border-zinc-600 p-3 space-y-2">
                    <div className="h-2 bg-amber-500 dark:bg-amber-400 rounded w-1/2" />
                    <div className="h-1.5 bg-zinc-300 dark:bg-zinc-600 rounded w-3/4" />
                    <div className="h-1.5 bg-zinc-300 dark:bg-zinc-600 rounded w-2/3" />
                  </div>
                  <div className="flex justify-center">
                    <div className="text-xs font-medium text-zinc-900 dark:text-white">
                      System
                    </div>
                  </div>
                </div>
                {settings.theme === 'system' && (
                  <div className="absolute top-2 right-2 flex items-center justify-center w-5 h-5 bg-amber-500 dark:bg-amber-400 rounded-full">
                    <svg className="w-3 h-3 text-white dark:text-zinc-900" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </label>
          </div>
        </div>

        <div className="border-t border-zinc-200 dark:border-zinc-700" />

        {/* Font Size */}
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-medium text-zinc-900 dark:text-white">
              Font Size
            </h3>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Adjust text size for better readability.
            </p>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="fontSize"
                value="small"
                checked={settings.fontSize === 'small'}
                onChange={() => handleChange('fontSize', 'small')}
                className="h-4 w-4 text-amber-500 border-zinc-300 dark:border-zinc-600 focus:ring-amber-500 dark:focus:ring-amber-400"
              />
              <span className="text-xs text-zinc-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400">
                Small - Compact and space-efficient
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="fontSize"
                value="medium"
                checked={settings.fontSize === 'medium'}
                onChange={() => handleChange('fontSize', 'medium')}
                className="h-4 w-4 text-amber-500 border-zinc-300 dark:border-zinc-600 focus:ring-amber-500 dark:focus:ring-amber-400"
              />
              <span className="text-sm text-zinc-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400">
                Medium - Default size (recommended)
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="fontSize"
                value="large"
                checked={settings.fontSize === 'large'}
                onChange={() => handleChange('fontSize', 'large')}
                className="h-4 w-4 text-amber-500 border-zinc-300 dark:border-zinc-600 focus:ring-amber-500 dark:focus:ring-amber-400"
              />
              <span className="text-base text-zinc-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400">
                Large - Easier to read
              </span>
            </label>
          </div>
        </div>

        <div className="border-t border-zinc-200 dark:border-zinc-700" />

        {/* Accessibility */}
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-medium text-zinc-900 dark:text-white">
              Accessibility
            </h3>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Options to improve usability.
            </p>
          </div>

          <label className="flex items-center justify-between cursor-pointer group">
            <div className="flex-1 pr-4">
              <div className="text-sm font-medium text-zinc-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400">
                Reduced motion
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Minimize animations and transitions
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.reducedMotion}
              onClick={() => handleChange('reducedMotion', !settings.reducedMotion)}
              className={`
                relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent
                transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2
                focus:ring-amber-500 dark:focus:ring-amber-400 focus:ring-offset-2
                ${settings.reducedMotion
                  ? 'bg-amber-500 dark:bg-amber-400'
                  : 'bg-zinc-200 dark:bg-zinc-700'
                }
              `}
            >
              <span
                className={`
                  pointer-events-none inline-block h-5 w-5 transform rounded-full
                  bg-white shadow ring-0 transition duration-200 ease-in-out
                  ${settings.reducedMotion ? 'translate-x-5' : 'translate-x-0'}
                `}
              />
            </button>
          </label>
        </div>

        <div className="border-t border-zinc-200 dark:border-zinc-700" />

        {/* Language */}
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-medium text-zinc-900 dark:text-white">
              Language
            </h3>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Select your preferred language.
            </p>
          </div>

          <div>
            <label htmlFor="language" className="sr-only">
              Language
            </label>
            <select
              id="language"
              value={settings.language}
              onChange={(e) => handleChange('language', e.target.value)}
              className="block w-full rounded-lg border border-zinc-300 dark:border-zinc-600
                bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white
                focus:border-amber-500 dark:focus:border-amber-400 focus:outline-none focus:ring-1
                focus:ring-amber-500 dark:focus:ring-amber-400"
            >
              {languageOptions.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
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
  );
}
