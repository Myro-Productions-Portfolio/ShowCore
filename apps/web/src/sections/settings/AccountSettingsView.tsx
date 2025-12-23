import React from 'react';
import { AccountSettings } from './components/AccountSettings';
import sampleData from './data.json';
import type { AccountManagement } from './types';

// Sample account management data with different states for testing
const accountManagement: AccountManagement = sampleData.accountManagement as AccountManagement;

// Alternative states for testing
// Active account with export ready
const accountWithExportReady: AccountManagement = {
  status: 'active',
  dataExportRequested: true,
  dataExportAvailableUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
};

// Deactivated account
const deactivatedAccount: AccountManagement = {
  status: 'deactivated',
  dataExportRequested: false,
};

// Deletion scheduled account
const deletionScheduledAccount: AccountManagement = {
  status: 'deletion_scheduled',
  deletionScheduledDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
  dataExportRequested: false,
};

export default function AccountSettingsView() {
  // Switch between different states for testing:
  // - accountManagement (default active)
  // - accountWithExportReady (active with export ready)
  // - deactivatedAccount (temporarily deactivated)
  // - deletionScheduledAccount (deletion scheduled)
  const [currentAccount, setCurrentAccount] = React.useState<AccountManagement>(accountManagement);

  const handleExportData = async () => {
    console.log('Export data requested');
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        console.log('Export prepared successfully');
        // Simulate export being ready
        setCurrentAccount({
          ...currentAccount,
          dataExportRequested: true,
          dataExportAvailableUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });
        resolve();
      }, 1000);
    });
  };

  const handleDeactivateAccount = async () => {
    console.log('Deactivate account');
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const confirmed = window.confirm(
          'Your account will be hidden from searches and you won\'t be able to book or be booked. You can reactivate anytime. Continue?'
        );
        if (confirmed) {
          console.log('Account deactivated');
          setCurrentAccount({
            ...currentAccount,
            status: 'deactivated',
          });
        }
        resolve();
      }, 500);
    });
  };

  const handleCancelDeactivation = async () => {
    console.log('Cancel deactivation');
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        console.log('Account reactivated');
        setCurrentAccount({
          ...currentAccount,
          status: 'active',
        });
        resolve();
      }, 500);
    });
  };

  const handleDeleteAccount = async () => {
    console.log('Delete account permanently');
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const deletionDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        console.log('Account deletion scheduled for:', deletionDate);
        setCurrentAccount({
          ...currentAccount,
          status: 'deletion_scheduled',
          deletionScheduledDate: deletionDate,
        });
        resolve();
      }, 1000);
    });
  };

  const handleCancelDeletion = async () => {
    console.log('Cancel account deletion');
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const confirmed = window.confirm('Are you sure you want to cancel the account deletion?');
        if (confirmed) {
          console.log('Account deletion cancelled');
          setCurrentAccount({
            status: 'active',
            dataExportRequested: false,
          });
        }
        resolve();
      }, 500);
    });
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            Account Management
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Manage your account status, export your data, or permanently delete your account.
          </p>
        </div>

        {/* State Toggle (for testing) */}
        <div className="mb-6 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-3">
            Test Different States:
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCurrentAccount(accountManagement)}
              className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm rounded-lg transition-colors"
            >
              Active
            </button>
            <button
              onClick={() => setCurrentAccount(accountWithExportReady)}
              className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm rounded-lg transition-colors"
            >
              Export Ready
            </button>
            <button
              onClick={() => setCurrentAccount(deactivatedAccount)}
              className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm rounded-lg transition-colors"
            >
              Deactivated
            </button>
            <button
              onClick={() => setCurrentAccount(deletionScheduledAccount)}
              className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm rounded-lg transition-colors"
            >
              Deletion Scheduled
            </button>
          </div>
        </div>

        {/* Account Settings Component */}
        <AccountSettings
          accountManagement={currentAccount}
          onExportData={handleExportData}
          onDeactivateAccount={handleDeactivateAccount}
          onCancelDeactivation={handleCancelDeactivation}
          onDeleteAccount={handleDeleteAccount}
          onCancelDeletion={handleCancelDeletion}
        />

        {/* Account Info Footer */}
        <div className="mt-8 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              Account created: {new Intl.DateTimeFormat('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              }).format(new Date(sampleData.technicianProfile.createdAt))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
