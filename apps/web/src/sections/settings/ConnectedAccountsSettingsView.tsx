import { useState } from 'react';
import { ConnectedAccountsSettings } from './components/ConnectedAccountsSettings';
import type { ConnectedAccount } from './types';

// Sample data
const sampleConnectedAccounts: ConnectedAccount[] = [
  {
    id: 'oauth_1',
    provider: 'google',
    email: 'sarah.chen@gmail.com',
    connectedAt: '2024-01-15T10:35:00Z',
    isConnected: true,
  },
  {
    id: 'oauth_2',
    provider: 'apple',
    email: 'sarah.chen@icloud.com',
    connectedAt: '2024-02-20T15:20:00Z',
    isConnected: true,
  },
  {
    id: 'oauth_3',
    provider: 'microsoft',
    email: '',
    connectedAt: '',
    isConnected: false,
  },
];

export default function ConnectedAccountsSettingsView() {
  const [accounts, setAccounts] = useState(sampleConnectedAccounts);
  const [error, setError] = useState<string | null>(null);

  const handleConnectAccount = async (provider: 'google' | 'apple' | 'microsoft') => {
    try {
      // Simulate OAuth flow
      await new Promise(resolve => setTimeout(resolve, 1500));

      const mockEmail = `user@${provider === 'microsoft' ? 'outlook.com' : provider + '.com'}`;
      const now = new Date().toISOString();

      setAccounts(prev => prev.map(acc =>
        acc.provider === provider
          ? {
              ...acc,
              email: mockEmail,
              connectedAt: now,
              isConnected: true,
            }
          : acc
      ));

      setError(null);
      console.log('Account connected:', provider);
    } catch (err) {
      setError('Failed to connect account. Please try again.');
      throw err;
    }
  };

  const handleDisconnectAccount = async (accountId: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setAccounts(prev => prev.map(acc =>
        acc.id === accountId
          ? {
              ...acc,
              email: '',
              connectedAt: '',
              isConnected: false,
            }
          : acc
      ));

      setError(null);
      console.log('Account disconnected:', accountId);
    } catch (err) {
      setError('Failed to disconnect account. Please try again.');
      throw err;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <ConnectedAccountsSettings
          connectedAccounts={accounts}
          onConnectAccount={handleConnectAccount}
          onDisconnectAccount={handleDisconnectAccount}
          error={error}
        />
      </div>
    </div>
  );
}
