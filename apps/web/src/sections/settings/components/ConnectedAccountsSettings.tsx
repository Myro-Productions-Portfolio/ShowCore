import { useState } from 'react';
import type { ConnectedAccountsProps } from '../types';

const PROVIDER_INFO = {
  google: {
    name: 'Google',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
  },
  apple: {
    name: 'Apple',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
      </svg>
    ),
  },
  microsoft: {
    name: 'Microsoft',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z" fill="currentColor"/>
      </svg>
    ),
  },
};

export function ConnectedAccountsSettings({
  connectedAccounts,
  onConnectAccount,
  onDisconnectAccount,
  isLoading = false,
  error = null,
}: ConnectedAccountsProps) {
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
  const [showDisconnectWarning, setShowDisconnectWarning] = useState<string | null>(null);

  const connectedCount = connectedAccounts.filter(acc => acc.isConnected).length;

  const handleConnect = async (provider: 'google' | 'apple' | 'microsoft') => {
    setConnectingProvider(provider);
    try {
      await onConnectAccount(provider);
    } catch (err) {
      // Error handled by parent
    } finally {
      setConnectingProvider(null);
    }
  };

  const handleDisconnect = async (accountId: string) => {
    // Check if this is the last connected account
    if (connectedCount === 1) {
      setShowDisconnectWarning(accountId);
      return;
    }

    setDisconnectingId(accountId);
    try {
      await onDisconnectAccount(accountId);
    } catch (err) {
      // Error handled by parent
    } finally {
      setDisconnectingId(null);
    }
  };

  const confirmDisconnect = async () => {
    if (!showDisconnectWarning) return;

    setDisconnectingId(showDisconnectWarning);
    try {
      await onDisconnectAccount(showDisconnectWarning);
    } catch (err) {
      // Error handled by parent
    } finally {
      setDisconnectingId(null);
      setShowDisconnectWarning(null);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  return (
    <div className="max-w-3xl space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
          Connected Accounts
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Link your accounts to sign in with one click and sync your data.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-4 border border-red-200 dark:border-red-900">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Warning Dialog */}
      {showDisconnectWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
              <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                Warning: Last Authentication Method
              </h3>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              This is your only connected account. Disconnecting it may prevent you from signing in.
              Make sure you have set a password or connected another account first.
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmDisconnect}
                disabled={disconnectingId !== null}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800
                  text-white rounded-lg font-medium text-sm transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {disconnectingId ? 'Disconnecting...' : 'Disconnect Anyway'}
              </button>
              <button
                onClick={() => setShowDisconnectWarning(null)}
                disabled={disconnectingId !== null}
                className="flex-1 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700
                  text-zinc-900 dark:text-white rounded-lg font-medium text-sm transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {connectedAccounts.map((account) => {
          const providerInfo = PROVIDER_INFO[account.provider];
          const isConnected = account.isConnected;
          const isProcessing =
            disconnectingId === account.id ||
            connectingProvider === account.provider;

          return (
            <div
              key={account.id}
              className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-4
                hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-0.5 text-zinc-700 dark:text-zinc-300">
                    {providerInfo.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-medium text-zinc-900 dark:text-white">
                        {providerInfo.name}
                      </h3>
                      {isConnected && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                          bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Connected
                        </span>
                      )}
                    </div>

                    {isConnected ? (
                      <div className="mt-1 space-y-0.5">
                        {account.email && (
                          <p className="text-sm text-zinc-600 dark:text-zinc-400 truncate">
                            {account.email}
                          </p>
                        )}
                        <p className="text-xs text-zinc-500 dark:text-zinc-500">
                          Connected {formatDate(account.connectedAt)}
                        </p>
                      </div>
                    ) : (
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                        Sign in with {providerInfo.name} to sync your account.
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex-shrink-0 sm:self-start">
                  {isConnected ? (
                    <button
                      onClick={() => handleDisconnect(account.id)}
                      disabled={isProcessing || isLoading}
                      className="w-full sm:w-auto px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400
                        hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30
                        rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {disconnectingId === account.id ? 'Disconnecting...' : 'Disconnect'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleConnect(account.provider)}
                      disabled={isProcessing || isLoading}
                      className="w-full sm:w-auto px-3 py-1.5 text-sm font-medium bg-amber-500 hover:bg-amber-600
                        dark:bg-amber-400 dark:hover:bg-amber-500 text-white dark:text-zinc-900
                        rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {connectingProvider === account.provider ? 'Connecting...' : 'Connect'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Box */}
      <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-4 border border-blue-200 dark:border-blue-900">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200">
              About connected accounts
            </h4>
            <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
              Connected accounts allow you to sign in quickly without entering your password.
              We recommend keeping at least one connected account or setting a password to ensure
              you can always access your account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
