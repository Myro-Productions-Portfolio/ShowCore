/**
 * BillingSettings Component (Companies)
 *
 * Manages subscription billing for companies including payment methods,
 * billing address, invoices, and subscription tier management.
 */

import { useState } from 'react';
import type {
  BillingInfo,
  CompanyTier,
  PaymentMethodFormData,
  BillingAddress,
} from '../types';

export interface BillingSettingsProps {
  billingInfo: BillingInfo;
  subscriptionTier: CompanyTier;
  onAddPaymentMethod: (data: PaymentMethodFormData) => Promise<void>;
  onRemovePaymentMethod: (methodId: string) => Promise<void>;
  onSetDefaultPaymentMethod: (methodId: string) => Promise<void>;
  onUpdateBillingAddress: (address: BillingAddress) => Promise<void>;
  onDownloadInvoice: (invoiceId: string) => void;
  onUpgradeTier: (tier: CompanyTier) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

const tierDetails: Record<CompanyTier, { name: string; price: number; features: string[] }> = {
  Free: {
    name: 'Free',
    price: 0,
    features: ['Up to 3 bookings/month', 'Basic messaging', 'Email support'],
  },
  Basic: {
    name: 'Basic',
    price: 29,
    features: ['Up to 15 bookings/month', 'Priority messaging', 'Email support', 'Basic analytics'],
  },
  Pro: {
    name: 'Pro',
    price: 99,
    features: ['Unlimited bookings', 'Team management', 'Priority support', 'Advanced analytics', 'Custom integrations'],
  },
  Enterprise: {
    name: 'Enterprise',
    price: 299,
    features: ['Everything in Pro', 'Dedicated account manager', 'Custom contracts', 'SLA guarantee', 'White-label options'],
  },
};

export function BillingSettings({
  billingInfo,
  subscriptionTier,
  onAddPaymentMethod,
  onRemovePaymentMethod,
  onSetDefaultPaymentMethod,
  onUpdateBillingAddress,
  onDownloadInvoice,
  onUpgradeTier,
  isLoading = false,
  error = null,
}: BillingSettingsProps) {
  const [showAddCard, setShowAddCard] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [editAddress, setEditAddress] = useState(false);

  // Payment method form state
  const [cardForm, setCardForm] = useState<Partial<PaymentMethodFormData>>({
    cardNumber: '',
    expiryMonth: undefined,
    expiryYear: undefined,
    cvv: '',
    cardholderName: '',
  });

  // Billing address form state
  const [addressForm, setAddressForm] = useState<BillingAddress>(billingInfo.billingAddress);

  const handleAddCard = async () => {
    if (cardForm.cardNumber && cardForm.expiryMonth && cardForm.expiryYear && cardForm.cvv && cardForm.cardholderName) {
      await onAddPaymentMethod({
        ...cardForm,
        billingAddress: billingInfo.billingAddress,
      } as PaymentMethodFormData);
      setCardForm({
        cardNumber: '',
        expiryMonth: undefined,
        expiryYear: undefined,
        cvv: '',
        cardholderName: '',
      });
      setShowAddCard(false);
    }
  };

  const handleRemoveCard = async (methodId: string) => {
    await onRemovePaymentMethod(methodId);
    setConfirmDelete(null);
  };

  const handleUpdateAddress = async () => {
    await onUpdateBillingAddress(addressForm);
    setEditAddress(false);
  };

  const getCardBrandIcon = (brand: string) => {
    const brandLower = brand.toLowerCase();
    if (brandLower === 'visa') {
      return (
        <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
          VISA
        </div>
      );
    }
    if (brandLower === 'mastercard') {
      return (
        <div className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center">
          <div className="flex gap-0.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-orange-400" />
          </div>
        </div>
      );
    }
    if (brandLower === 'amex') {
      return (
        <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
          AMEX
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center">
        <svg className="w-5 h-5 text-zinc-600 dark:text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Billing & Subscription
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Manage your subscription, payment methods, and billing information.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Current Subscription Tier */}
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Current Plan: {tierDetails[subscriptionTier].name}
            </h3>
            <p className="mt-1 text-2xl font-bold text-amber-800 dark:text-amber-100">
              ${tierDetails[subscriptionTier].price}
              <span className="text-base font-normal text-zinc-600 dark:text-zinc-400">/month</span>
            </p>
            <ul className="mt-4 space-y-2">
              {tierDetails[subscriptionTier].features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
          {subscriptionTier !== 'Enterprise' && (
            <button
              onClick={() => setShowUpgrade(!showUpgrade)}
              className="px-4 py-2 text-sm font-medium text-amber-800 dark:text-amber-100 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
            >
              {showUpgrade ? 'Hide Plans' : 'Upgrade Plan'}
            </button>
          )}
        </div>

        {/* Upgrade Options */}
        {showUpgrade && (
          <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-700">
            <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-4">
              Available Plans
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(tierDetails)
                .filter(([tier]) => tier !== subscriptionTier && tier !== 'Free')
                .map(([tier, details]) => (
                  <div
                    key={tier}
                    className="rounded-lg border border-zinc-200 dark:border-zinc-600 p-4 hover:border-amber-400 dark:hover:border-amber-600 transition-colors"
                  >
                    <h5 className="font-semibold text-zinc-900 dark:text-zinc-100">{details.name}</h5>
                    <p className="mt-1 text-xl font-bold text-amber-800 dark:text-amber-100">
                      ${details.price}<span className="text-sm font-normal">/mo</span>
                    </p>
                    <button
                      onClick={() => onUpgradeTier(tier as CompanyTier)}
                      disabled={isLoading}
                      className="mt-3 w-full px-3 py-1.5 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {tier === 'Enterprise' ? 'Contact Sales' : 'Upgrade'}
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Payment Methods */}
      <div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
          Payment Methods
        </h3>
        <div className="space-y-3">
          {billingInfo.paymentMethods.map((method) => (
            <div
              key={method.id}
              className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  {/* Card Icon */}
                  {method.cardBrand && getCardBrandIcon(method.cardBrand)}

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {method.cardBrand?.toUpperCase()} ••••{method.last4}
                      </h4>
                      {method.isDefault && (
                        <span className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-100">
                          Default
                        </span>
                      )}
                    </div>
                    {method.expiryMonth && method.expiryYear && (
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                        Expires {method.expiryMonth.toString().padStart(2, '0')}/{method.expiryYear}
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-500">
                      Added {new Date(method.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-start gap-2">
                  {!method.isDefault && (
                    <button
                      onClick={() => onSetDefaultPaymentMethod(method.id)}
                      disabled={isLoading}
                      className="text-sm text-amber-800 dark:text-amber-100 hover:text-amber-900 dark:hover:text-amber-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Set Default
                    </button>
                  )}
                  <button
                    onClick={() => setConfirmDelete(method.id)}
                    disabled={isLoading || method.isDefault}
                    className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={method.isDefault ? 'Cannot delete default payment method' : 'Delete payment method'}
                  >
                    Remove
                  </button>
                </div>
              </div>

              {/* Delete Confirmation */}
              {confirmDelete === method.id && (
                <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-3">
                    Are you sure you want to remove this payment method? This action cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRemoveCard(method.id)}
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

          {/* Add Card Button */}
          {!showAddCard && (
            <button
              onClick={() => setShowAddCard(true)}
              disabled={isLoading}
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-amber-800 dark:text-amber-100 hover:bg-amber-50 dark:hover:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Payment Method
            </button>
          )}

          {/* Add Card Form */}
          {showAddCard && (
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6">
              <h4 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                Add Payment Method
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    value={cardForm.cardholderName}
                    onChange={(e) => setCardForm({ ...cardForm, cardholderName: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600 focus:border-transparent"
                    placeholder="Name on card"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    value={cardForm.cardNumber}
                    onChange={(e) => setCardForm({ ...cardForm, cardNumber: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600 focus:border-transparent"
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Month
                    </label>
                    <input
                      type="number"
                      value={cardForm.expiryMonth || ''}
                      onChange={(e) => setCardForm({ ...cardForm, expiryMonth: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600 focus:border-transparent"
                      placeholder="MM"
                      min={1}
                      max={12}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Year
                    </label>
                    <input
                      type="number"
                      value={cardForm.expiryYear || ''}
                      onChange={(e) => setCardForm({ ...cardForm, expiryYear: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600 focus:border-transparent"
                      placeholder="YYYY"
                      min={2025}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      CVV
                    </label>
                    <input
                      type="text"
                      value={cardForm.cvv}
                      onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600 focus:border-transparent"
                      placeholder="123"
                      maxLength={4}
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleAddCard}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Adding...' : 'Add Card'}
                </button>
                <button
                  onClick={() => setShowAddCard(false)}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Billing Address */}
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Billing Address
          </h3>
          {!editAddress && (
            <button
              onClick={() => {
                setAddressForm(billingInfo.billingAddress);
                setEditAddress(true);
              }}
              className="text-sm text-amber-800 dark:text-amber-100 hover:text-amber-900 dark:hover:text-amber-50"
            >
              Edit
            </button>
          )}
        </div>

        {!editAddress ? (
          <div className="text-sm text-zinc-700 dark:text-zinc-300 space-y-1">
            <p>{billingInfo.billingAddress.line1}</p>
            {billingInfo.billingAddress.line2 && <p>{billingInfo.billingAddress.line2}</p>}
            <p>
              {billingInfo.billingAddress.city}, {billingInfo.billingAddress.state} {billingInfo.billingAddress.postalCode}
            </p>
            <p>{billingInfo.billingAddress.country}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Address Line 1
              </label>
              <input
                type="text"
                value={addressForm.line1}
                onChange={(e) => setAddressForm({ ...addressForm, line1: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Address Line 2 (Optional)
              </label>
              <input
                type="text"
                value={addressForm.line2 || ''}
                onChange={(e) => setAddressForm({ ...addressForm, line2: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600 focus:border-transparent"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={addressForm.city}
                  onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={addressForm.state}
                  onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  value={addressForm.postalCode}
                  onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Country
              </label>
              <input
                type="text"
                value={addressForm.country}
                onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600 focus:border-transparent"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleUpdateAddress}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Saving...' : 'Save Address'}
              </button>
              <button
                onClick={() => setEditAddress(false)}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Invoice History */}
      <div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
          Invoice History
        </h3>
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-50 dark:bg-zinc-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {billingInfo.invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-700/30">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {invoice.invoiceNumber}
                      </div>
                      <div className="text-sm text-zinc-500 dark:text-zinc-400">
                        {invoice.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-700 dark:text-zinc-300">
                      {new Date(invoice.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      ${invoice.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          invoice.status === 'paid'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                            : invoice.status === 'pending'
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                        }`}
                      >
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => onDownloadInvoice(invoice.id)}
                        className="text-amber-800 dark:text-amber-100 hover:text-amber-900 dark:hover:text-amber-50 font-medium"
                      >
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {billingInfo.invoices.length === 0 && (
            <div className="p-8 text-center">
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h4 className="mt-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                No Invoices
              </h4>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Your subscription invoices will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
