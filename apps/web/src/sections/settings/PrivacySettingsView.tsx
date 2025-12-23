import { useState } from 'react';
import { PrivacySettings } from './components/PrivacySettings';
import type { PrivacySettings as PrivacySettingsType } from './types';

// Sample data
const samplePrivacySettings: PrivacySettingsType = {
  emailVisibility: 'connections',
  phoneVisibility: 'private',
  profileVisibility: 'public',
  allowDataSharing: true,
  allowMarketingCommunications: false,
};

export default function PrivacySettingsView() {
  const [settings, setSettings] = useState(samplePrivacySettings);
  const [error, setError] = useState<string | null>(null);

  const handleUpdatePrivacy = async (newSettings: PrivacySettingsType) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSettings(newSettings);
      setError(null);
      console.log('Privacy settings updated:', newSettings);
    } catch (err) {
      setError('Failed to update privacy settings. Please try again.');
      throw err;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <PrivacySettings
          privacySettings={settings}
          onUpdatePrivacy={handleUpdatePrivacy}
          error={error}
        />
      </div>
    </div>
  );
}
