/**
 * PayoutSettings Component (Technicians)
 *
 * Manages payout methods for technicians including bank accounts and PayPal.
 * Features include adding/removing methods, setting default, and viewing payout history.
 */

import { useState } from 'react';
import type {
  PayoutMethod,
  BankAccountFormData,
  PayPalFormData,
} from '../types';

export interface PayoutSettingsProps {
  payoutMethods: PayoutMethod[];
  onAddBankAccount: (data: BankAccountFormData) => Promise<void>;
  onAddPayPal: (data: PayPalFormData) => Promise<void>;
  onRemoveMethod: (methodId: string) => Promise<void>;
  onSetDefaultMethod: (methodId: string) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export function PayoutSettings({
  payoutMethods,
  onAddBankAccount,
  onAddPayPal,
  onRemoveMethod,
  onSetDefaultMethod,
  isLoading = false,
  error = null,
}: PayoutSettingsProps) {
  const [showAddMethod, setShowAddMethod] = useState(false);
  const [methodType, setMethodType] = useState<'bank_account' | 'paypal'>('bank_account');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Bank account form state
  const [bankForm, setBankForm] = useState<BankAccountFormData>({
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    routingNumber: '',
    accountType: 'checking',
  });

  // PayPal form state
  const [paypalForm, setPaypalForm] = useState<PayPalFormData>({
    email: '',
  });

  const handleAddMethod = async () => {
    if (methodType === 'bank_account') {
      await onAddBankAccount(bankForm);
      setBankForm({
        bankName: '',
        accountHolderName: '',
        accountNumber: '',
        routingNumber: '',
        accountType: 'checking',
      });
    } else {
      await onAddPayPal(paypalForm);
      setPaypalForm({ email: '' });
    }
    setShowAddMethod(false);
  };

  const handleRemoveMethod = async (methodId: string) => {
    await onRemoveMethod(methodId);
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Payout Methods
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Manage how you receive payments for completed bookings.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Payout Schedule Info */}
      <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
        <div className="flex gap-3">
          <svg
            className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-amber-900 dark:text-amber-100">
              Payout Schedule
            </h3>
            <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
              Payments are processed every Friday for bookings completed in the previous week.
              Funds typically arrive within 2-3 business days.
            </p>
          </div>
        </div>
      </div>

      {/* Payout Methods List */}
      <div className="space-y-3">
        {payoutMethods.map((method) => (
          <div
            key={method.id}
            className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                {/* Icon */}
                <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0">
                  {method.type === 'bank_account' ? (
                    <svg
                      className="w-5 h-5 text-zinc-600 dark:text-zinc-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5 text-blue-600 dark:text-blue-400"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M20.067 8.478c.492.88.556 2.014.3 3.327-.74 3.806-3.276 5.12-6.514 5.12h-.5a.805.805 0 00-.794.68l-.04.22-.63 3.993-.028.15a.806.806 0 01-.795.68H8.85c-.285 0-.506-.24-.453-.53l.003-.013 1.317-8.335c.055-.346.359-.61.707-.61h1.373c2.86 0 5.097-.935 5.753-3.64.306-1.261.147-2.315-.54-3.042z" />
                      <path d="M9.768 8.478c.132-.743.488-1.279 1.022-1.548.284-.143.612-.214.976-.214h4.87c.576 0 1.119.067 1.623.207.09.025.178.053.265.084.357.13.683.306.977.53.492.88.556 2.015.3 3.327-.74 3.806-3.276 5.12-6.514 5.12h-.5a.805.805 0 00-.794.68l-.04.22-.63 3.993-.028.15a.806.806 0 01-.795.68H8.85c-.285 0-.506-.24-.453-.53l.003-.013 1.317-8.335c.055-.346.359-.61.707-.61h1.373c.914 0 1.748-.123 2.486-.362z" />
                    </svg>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  {method.type === 'bank_account' ? (
                    <>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {method.bankName}
                        </h3>
                        {method.isDefault && (
                          <span className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-300">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                        {method.accountType.charAt(0).toUpperCase() + method.accountType.slice(1)} ••••{method.accountNumberLast4}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-500">
                        {method.accountHolderName}
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          PayPal
                        </h3>
                        {method.isDefault && (
                          <span className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-300">
                            Default
                          </span>
                        )}
                        {method.verified && (
                          <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-0.5 text-xs font-medium text-green-800 dark:text-green-300">
                            Verified
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                        {method.email}
                      </p>
                    </>
                  )}
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                    Added {new Date(method.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-start gap-2">
                {!method.isDefault && (
                  <button
                    onClick={() => onSetDefaultMethod(method.id)}
                    disabled={isLoading}
                    className="text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Set Default
                  </button>
                )}
                <button
                  onClick={() => setConfirmDelete(method.id)}
                  disabled={isLoading || method.isDefault}
                  className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={method.isDefault ? 'Cannot delete default method' : 'Delete method'}
                >
                  Remove
                </button>
              </div>
            </div>

            {/* Delete Confirmation */}
            {confirmDelete === method.id && (
              <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-3">
                  Are you sure you want to remove this payout method? This action cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRemoveMethod(method.id)}
                    disabled={isLoading}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Removing...' : 'Remove Method'}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    disabled={isLoading}
                    className="px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Empty State */}
        {payoutMethods.length === 0 && (
          <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800/50 p-8 text-center">
            <svg
              className="mx-auto w-12 h-12 text-zinc-400 dark:text-zinc-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
            <h3 className="mt-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
              No Payout Methods
            </h3>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Add a bank account or PayPal to receive payments.
            </p>
          </div>
        )}
      </div>

      {/* Add Method Button */}
      {!showAddMethod && (
        <button
          onClick={() => setShowAddMethod(true)}
          disabled={isLoading}
          className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add Payout Method
        </button>
      )}

      {/* Add Method Form */}
      {showAddMethod && (
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Add Payout Method
          </h3>

          {/* Method Type Selector */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setMethodType('bank_account')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                methodType === 'bank_account'
                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100 border border-amber-300 dark:border-amber-700'
                  : 'bg-zinc-50 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-600'
              }`}
            >
              Bank Account
            </button>
            <button
              onClick={() => setMethodType('paypal')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                methodType === 'paypal'
                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100 border border-amber-300 dark:border-amber-700'
                  : 'bg-zinc-50 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-600'
              }`}
            >
              PayPal
            </button>
          </div>

          {/* Bank Account Form */}
          {methodType === 'bank_account' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={bankForm.bankName}
                  onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600 focus:border-transparent"
                  placeholder="e.g., Chase Bank"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  value={bankForm.accountHolderName}
                  onChange={(e) => setBankForm({ ...bankForm, accountHolderName: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600 focus:border-transparent"
                  placeholder="Full name on account"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Routing Number
                  </label>
                  <input
                    type="text"
                    value={bankForm.routingNumber}
                    onChange={(e) => setBankForm({ ...bankForm, routingNumber: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600 focus:border-transparent"
                    placeholder="9 digits"
                    maxLength={9}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={bankForm.accountNumber}
                    onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600 focus:border-transparent"
                    placeholder="Account number"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Account Type
                </label>
                <select
                  value={bankForm.accountType}
                  onChange={(e) => setBankForm({ ...bankForm, accountType: e.target.value as 'checking' | 'savings' })}
                  className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600 focus:border-transparent"
                >
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                </select>
              </div>
            </div>
          )}

          {/* PayPal Form */}
          {methodType === 'paypal' && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                PayPal Email
              </label>
              <input
                type="email"
                value={paypalForm.email}
                onChange={(e) => setPaypalForm({ email: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600 focus:border-transparent"
                placeholder="your-email@example.com"
              />
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                Enter the email address associated with your PayPal account
              </p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleAddMethod}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Adding...' : 'Add Method'}
            </button>
            <button
              onClick={() => setShowAddMethod(false)}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
