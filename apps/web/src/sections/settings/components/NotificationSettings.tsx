import { useState } from 'react'
import type { NotificationSettingsProps, NotificationPreferences } from '../types'

export function NotificationSettings({
  preferences,
  onUpdatePreferences,
  isLoading = false,
  error = null,
}: NotificationSettingsProps) {
  const [localPreferences, setLocalPreferences] = useState<NotificationPreferences>(preferences)
  const [isSaving, setIsSaving] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [autoSave, setAutoSave] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const handleToggle = (category: keyof NotificationPreferences, channel: 'email' | 'push' | 'sms') => {
    const updated = {
      ...localPreferences,
      [category]: {
        ...localPreferences[category],
        [channel]: !localPreferences[category][channel],
      },
    }
    setLocalPreferences(updated)
    setHasChanges(true)

    if (autoSave) {
      handleSave(updated)
    }
  }

  const handleMasterToggle = (channel: 'email' | 'push' | 'sms', enabled: boolean) => {
    const updated = {
      bookings: { ...localPreferences.bookings, [channel]: enabled },
      messages: { ...localPreferences.messages, [channel]: enabled },
      reviews: { ...localPreferences.reviews, [channel]: enabled },
      systemUpdates: { ...localPreferences.systemUpdates, [channel]: enabled },
      marketingCommunications: { ...localPreferences.marketingCommunications, [channel]: enabled },
    }
    setLocalPreferences(updated)
    setHasChanges(true)

    if (autoSave) {
      handleSave(updated)
    }
  }

  const handleSave = async (prefs: NotificationPreferences = localPreferences) => {
    setIsSaving(true)
    try {
      await onUpdatePreferences(prefs)
      setHasChanges(false)
    } catch (err) {
      console.error('Failed to save preferences:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAutoSaveToggle = () => {
    setAutoSave(!autoSave)
  }

  const categories = [
    {
      id: 'bookings' as const,
      title: 'Bookings',
      description: 'Booking confirmations, updates, and reminders',
    },
    {
      id: 'messages' as const,
      title: 'Messages',
      description: 'New messages and message replies',
    },
    {
      id: 'reviews' as const,
      title: 'Reviews',
      description: 'New reviews and review responses',
    },
    {
      id: 'systemUpdates' as const,
      title: 'System Updates',
      description: 'Platform updates and maintenance notifications',
    },
    {
      id: 'marketingCommunications' as const,
      title: 'Marketing',
      description: 'Newsletter, tips, and promotional content',
    },
  ]

  const allEmailEnabled = categories.every((cat) => localPreferences[cat.id].email)
  const allPushEnabled = categories.every((cat) => localPreferences[cat.id].push)
  const allSmsEnabled = categories.every((cat) => localPreferences[cat.id].sms)

  return (
    <div className="max-w-4xl mx-auto p-6 sm:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
          Notification Preferences
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Choose how you want to receive notifications
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Auto-save Toggle */}
      <div className="mb-8 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Auto-save changes
            </span>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
              Automatically save when you toggle notifications
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={autoSave}
            onClick={handleAutoSaveToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              autoSave
                ? 'bg-amber-500 dark:bg-amber-600'
                : 'bg-zinc-300 dark:bg-zinc-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                autoSave ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </label>
      </div>

      {/* Master Toggles */}
      <div className="mb-8 p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
          Quick Controls
        </h2>
        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              All Email Notifications
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={allEmailEnabled}
              onClick={() => handleMasterToggle('email', !allEmailEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                allEmailEnabled
                  ? 'bg-amber-500 dark:bg-amber-600'
                  : 'bg-zinc-300 dark:bg-zinc-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  allEmailEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              All Push Notifications
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={allPushEnabled}
              onClick={() => handleMasterToggle('push', !allPushEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                allPushEnabled
                  ? 'bg-amber-500 dark:bg-amber-600'
                  : 'bg-zinc-300 dark:bg-zinc-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  allPushEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              All SMS Notifications
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={allSmsEnabled}
              onClick={() => handleMasterToggle('sms', !allSmsEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                allSmsEnabled
                  ? 'bg-amber-500 dark:bg-amber-600'
                  : 'bg-zinc-300 dark:bg-zinc-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  allSmsEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </label>
        </div>
      </div>

      {/* SMS Phone Number Input */}
      {!phoneNumber && categories.some((cat) => localPreferences[cat.id].sms) && (
        <div className="mb-8 p-6 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2">
            SMS Phone Number Required
          </h3>
          <p className="text-sm text-amber-800 dark:text-amber-100 mb-4">
            Add your phone number to receive SMS notifications
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1 (555) 123-4567"
              className="flex-1 px-4 py-2 bg-white dark:bg-zinc-900 border border-amber-300 dark:border-amber-700 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              type="button"
              onClick={() => {
                console.log('Save phone number:', phoneNumber)
              }}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors sm:whitespace-nowrap"
            >
              Add Phone
            </button>
          </div>
        </div>
      )}

      {/* Notification Categories */}
      <div className="space-y-6">
        {/* Section Header with Description */}
        <div className="mb-2">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-1">
            Notification Categories
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Choose how you want to be notified for each type of activity. Toggle the channels below to customize your preferences.
          </p>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-[1fr,auto,auto,auto] gap-6 px-6 pb-3 pt-2 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
            Category
          </div>
          <div className="flex justify-center w-16">
            <span className="inline-flex items-center px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
              Email
            </span>
          </div>
          <div className="flex justify-center w-16">
            <span className="inline-flex items-center px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
              Push
            </span>
          </div>
          <div className="flex justify-center w-16">
            <span className="inline-flex items-center px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
              SMS
            </span>
          </div>
        </div>

        {/* Categories */}
        {categories.map((category) => (
          <div
            key={category.id}
            className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm"
          >
            <div className="grid grid-cols-[1fr,auto,auto,auto] gap-4 items-start">
              <div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 mb-1">
                  {category.title}
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {category.description}
                </p>
              </div>

              {/* Email Toggle */}
              <div className="flex justify-center w-16">
                <button
                  type="button"
                  role="switch"
                  aria-checked={localPreferences[category.id].email}
                  aria-label={`${category.title} email notifications`}
                  onClick={() => handleToggle(category.id, 'email')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    localPreferences[category.id].email
                      ? 'bg-amber-500 dark:bg-amber-600'
                      : 'bg-zinc-300 dark:bg-zinc-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      localPreferences[category.id].email ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Push Toggle */}
              <div className="flex justify-center w-16">
                <button
                  type="button"
                  role="switch"
                  aria-checked={localPreferences[category.id].push}
                  aria-label={`${category.title} push notifications`}
                  onClick={() => handleToggle(category.id, 'push')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    localPreferences[category.id].push
                      ? 'bg-amber-500 dark:bg-amber-600'
                      : 'bg-zinc-300 dark:bg-zinc-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      localPreferences[category.id].push ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* SMS Toggle */}
              <div className="flex justify-center w-16">
                <button
                  type="button"
                  role="switch"
                  aria-checked={localPreferences[category.id].sms}
                  aria-label={`${category.title} SMS notifications`}
                  onClick={() => handleToggle(category.id, 'sms')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    localPreferences[category.id].sms
                      ? 'bg-amber-500 dark:bg-amber-600'
                      : 'bg-zinc-300 dark:bg-zinc-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      localPreferences[category.id].sms ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Save Button */}
      {!autoSave && (
        <div className="mt-8 flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            {hasChanges ? 'You have unsaved changes' : 'All changes saved'}
          </div>
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={!hasChanges || isSaving || isLoading}
            className={`px-6 py-2.5 font-semibold rounded-lg transition-all ${
              hasChanges && !isSaving && !isLoading
                ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm'
                : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
            }`}
          >
            {isSaving || isLoading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Saving...
              </span>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      )}

      {/* Auto-save Indicator */}
      {autoSave && hasChanges && (
        <div className="mt-8 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-green-800 dark:text-green-300">
            <svg
              className="h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                clipRule="evenodd"
              />
            </svg>
            Preferences saved automatically
          </div>
        </div>
      )}
    </div>
  )
}
