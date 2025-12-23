import { useState } from 'react';
import type { AccountManagementProps } from '../types';

export function AccountSettings({
  accountManagement,
  onExportData,
  onDeactivateAccount,
  onCancelDeactivation,
  onDeleteAccount,
  onCancelDeletion,
  isLoading = false,
  error = null,
}: AccountManagementProps) {
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const isDeleteConfirmed = deleteConfirmText === 'DELETE';
  const isDeletionScheduled = accountManagement.status === 'deletion_scheduled';
  const isDeactivated = accountManagement.status === 'deactivated';

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(dateString));
  };

  const handleExportData = async () => {
    try {
      await onExportData();
    } catch (err) {
      console.error('Failed to export data:', err);
    }
  };

  const handleDeactivate = async () => {
    try {
      await onDeactivateAccount();
      setShowDeactivateModal(false);
    } catch (err) {
      console.error('Failed to deactivate account:', err);
    }
  };

  const handleCancelDeactivation = async () => {
    try {
      await onCancelDeactivation();
    } catch (err) {
      console.error('Failed to cancel deactivation:', err);
    }
  };

  const handleDelete = async () => {
    if (!isDeleteConfirmed || !passwordConfirm) return;

    try {
      await onDeleteAccount();
      setShowDeleteModal(false);
      setDeleteConfirmText('');
      setPasswordConfirm('');
    } catch (err) {
      console.error('Failed to delete account:', err);
    }
  };

  const handleCancelDeletion = async () => {
    try {
      await onCancelDeletion();
    } catch (err) {
      console.error('Failed to cancel deletion:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      {/* Account Status */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          Account Status
        </h2>

        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${
            accountManagement.status === 'active'
              ? 'bg-green-500 dark:bg-green-400'
              : accountManagement.status === 'deactivated'
              ? 'bg-amber-500 dark:bg-amber-400'
              : 'bg-red-500 dark:bg-red-400'
          }`} />
          <div>
            <p className="font-medium text-zinc-900 dark:text-zinc-100">
              {accountManagement.status === 'active' && 'Active'}
              {accountManagement.status === 'deactivated' && 'Deactivated'}
              {accountManagement.status === 'deletion_scheduled' && 'Deletion Scheduled'}
            </p>
            {isDeletionScheduled && accountManagement.deletionScheduledDate && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                Your account will be permanently deleted on {formatDate(accountManagement.deletionScheduledDate)}
              </p>
            )}
            {isDeactivated && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                Your account is temporarily deactivated. You can reactivate it at any time.
              </p>
            )}
          </div>
        </div>

        {/* Cancel Deletion/Deactivation */}
        {isDeletionScheduled && (
          <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
              You can cancel the deletion within the 30-day grace period.
            </p>
            <button
              onClick={handleCancelDeletion}
              disabled={isLoading}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {isLoading ? 'Canceling...' : 'Cancel Deletion'}
            </button>
          </div>
        )}

        {isDeactivated && (
          <div className="mt-4">
            <button
              onClick={handleCancelDeactivation}
              disabled={isLoading}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {isLoading ? 'Reactivating...' : 'Reactivate Account'}
            </button>
          </div>
        )}
      </div>

      {/* Export Data */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </div>

          <div className="flex-1">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              Export Your Data
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              Download a copy of your account data, including your profile, bookings, messages, and reviews.
              Available formats: JSON, CSV.
            </p>

            {accountManagement.dataExportRequested && accountManagement.dataExportAvailableUntil ? (
              <div className="space-y-3">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        Your export is ready
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        Available until {formatDate(accountManagement.dataExportAvailableUntil)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => console.log('Download JSON')}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Download JSON
                  </button>
                  <button
                    onClick={() => console.log('Download CSV')}
                    className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm font-medium rounded-lg transition-colors"
                  >
                    Download CSV
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleExportData}
                disabled={isLoading}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {isLoading ? 'Preparing Export...' : 'Request Data Export'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Deactivate Account */}
      {!isDeactivated && !isDeletionScheduled && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>

            <div className="flex-1">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                Deactivate Account
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                Temporarily disable your account. Your profile will be hidden from searches, and you won't be able
                to book or be booked. You can reactivate at any time.
              </p>

              <button
                onClick={() => setShowDeactivateModal(true)}
                disabled={isLoading}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm font-medium rounded-lg transition-colors"
              >
                Deactivate Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account - Danger Zone */}
      {!isDeletionScheduled && (
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <div className="flex-1">
              <h2 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
                Delete Account
              </h2>
              <div className="space-y-2 text-sm text-red-800 dark:text-red-200 mb-4">
                <p className="font-medium">Warning: This action cannot be undone.</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>All your data will be permanently deleted</li>
                  <li>Your bookings and messages will be removed</li>
                  <li>Your reviews and ratings will be anonymized</li>
                  <li>You have 30 days to cancel before permanent deletion</li>
                </ul>
              </div>

              <button
                onClick={() => setShowDeleteModal(true)}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Delete My Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              Deactivate Account
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
              Your account will be hidden from searches and you won't be able to book or be booked.
              You can reactivate anytime. Are you sure?
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeactivateModal(false)}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeactivate}
                disabled={isLoading}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {isLoading ? 'Deactivating...' : 'Deactivate Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-red-900 dark:text-red-100">
                Delete Account
              </h3>
            </div>

            <div className="space-y-4 mb-6">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-200 font-medium mb-2">
                  This action cannot be undone.
                </p>
                <ul className="text-sm text-red-700 dark:text-red-300 list-disc list-inside space-y-1">
                  <li>All data will be permanently deleted in 30 days</li>
                  <li>You can cancel within the grace period</li>
                  <li>After 30 days, recovery is impossible</li>
                </ul>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                  Type <span className="font-mono font-bold">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="DELETE"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                  Enter your password
                </label>
                <input
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Password"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                  setPasswordConfirm('');
                }}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={!isDeleteConfirmed || !passwordConfirm || isLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
              >
                {isLoading ? 'Deleting...' : 'Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
