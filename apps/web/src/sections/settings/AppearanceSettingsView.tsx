import { useState } from 'react';
import { AppearanceSettings } from './components/AppearanceSettings';
import type { AppearanceSettings as AppearanceSettingsType } from '../types';

// Sample data
const sampleAppearanceSettings: AppearanceSettingsType = {
  theme: 'system',
  fontSize: 'medium',
  reducedMotion: false,
  language: 'en-US',
};

export default function AppearanceSettingsView() {
  const [settings, setSettings] = useState(sampleAppearanceSettings);
  const [error, setError] = useState<string | null>(null);

  const handleUpdateAppearance = async (newSettings: AppearanceSettingsType) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSettings(newSettings);
      setError(null);
      console.log('Appearance settings updated:', newSettings);
    } catch (err) {
      setError('Failed to update appearance settings. Please try again.');
      throw err;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <AppearanceSettings
          appearanceSettings={settings}
          onUpdateAppearance={handleUpdateAppearance}
          error={error}
        />
      </div>
    </div>
  );
}
