/**
 * PaymentSettingsView - Preview Wrapper
 *
 * Role-based payment settings view that shows PayoutSettings for technicians
 * and BillingSettings for companies.
 */

import { useState } from 'react';
import { PayoutSettings } from './components/PayoutSettings';
import { BillingSettings } from './components/BillingSettings';
import sampleData from '../data.json';
import type {
  PayoutMethod,
  BankAccountFormData,
  PayPalFormData,
  BillingInfo,
  CompanyTier,
  PaymentMethodFormData,
  BillingAddress,
} from '../types';

export default function PaymentSettingsView() {
  const [role, setRole] = useState<'technician' | 'company'>('technician');
  const [payoutMethods, setPayoutMethods] = useState<PayoutMethod[]>(
    sampleData.samplePayoutMethods as PayoutMethod[]
  );
  const [billingInfo, setBillingInfo] = useState<BillingInfo>(
    sampleData.companyProfile.billingInfo as BillingInfo
  );
  const [subscriptionTier, setSubscriptionTier] = useState<CompanyTier>(
    sampleData.companyProfile.subscriptionTier as CompanyTier
  );
  const [isLoading, setIsLoading] = useState(false);

  // Technician handlers
  const handleAddBankAccount = async (data: BankAccountFormData) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const newMethod: PayoutMethod = {
      id: `payout_${Date.now()}`,
      type: 'bank_account',
      isDefault: payoutMethods.length === 0,
      bankName: data.bankName,
      accountHolderName: data.accountHolderName,
      accountNumberLast4: data.accountNumber.slice(-4),
      routingNumber: data.routingNumber,
      accountType: data.accountType,
      createdAt: new Date().toISOString(),
    };

    setPayoutMethods([...payoutMethods, newMethod]);
    setIsLoading(false);
  };

  const handleAddPayPal = async (data: PayPalFormData) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const newMethod: PayoutMethod = {
      id: `payout_${Date.now()}`,
      type: 'paypal',
      isDefault: payoutMethods.length === 0,
      email: data.email,
      verified: true,
      createdAt: new Date().toISOString(),
    };

    setPayoutMethods([...payoutMethods, newMethod]);
    setIsLoading(false);
  };

  const handleRemovePayoutMethod = async (methodId: string) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setPayoutMethods(payoutMethods.filter((m) => m.id !== methodId));
    setIsLoading(false);
  };

  const handleSetDefaultPayoutMethod = async (methodId: string) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setPayoutMethods(
      payoutMethods.map((m) => ({
        ...m,
        isDefault: m.id === methodId,
      }))
    );
    setIsLoading(false);
  };

  // Company handlers
  const handleAddPaymentMethod = async (data: PaymentMethodFormData) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const cardBrand = data.cardNumber.startsWith('4')
      ? 'visa'
      : data.cardNumber.startsWith('5')
      ? 'mastercard'
      : data.cardNumber.startsWith('3')
      ? 'amex'
      : 'unknown';

    const newMethod = {
      id: `pm_${Date.now()}`,
      type: 'card' as const,
      isDefault: billingInfo.paymentMethods.length === 0,
      cardBrand,
      last4: data.cardNumber.slice(-4),
      expiryMonth: data.expiryMonth,
      expiryYear: data.expiryYear,
      createdAt: new Date().toISOString(),
    };

    setBillingInfo({
      ...billingInfo,
      paymentMethods: [...billingInfo.paymentMethods, newMethod],
    });
    setIsLoading(false);
  };

  const handleRemovePaymentMethod = async (methodId: string) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setBillingInfo({
      ...billingInfo,
      paymentMethods: billingInfo.paymentMethods.filter((m) => m.id !== methodId),
    });
    setIsLoading(false);
  };

  const handleSetDefaultPaymentMethod = async (methodId: string) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setBillingInfo({
      ...billingInfo,
      paymentMethods: billingInfo.paymentMethods.map((m) => ({
        ...m,
        isDefault: m.id === methodId,
      })),
    });
    setIsLoading(false);
  };

  const handleUpdateBillingAddress = async (address: BillingAddress) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setBillingInfo({
      ...billingInfo,
      billingAddress: address,
    });
    setIsLoading(false);
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    const invoice = billingInfo.invoices.find((inv) => inv.id === invoiceId);
    if (invoice) {
      window.open(invoice.downloadUrl, '_blank');
    }
  };

  const handleUpgradeTier = async (tier: CompanyTier) => {
    if (tier === 'Enterprise') {
      alert('Contact sales for Enterprise plan');
      return;
    }
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSubscriptionTier(tier);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Role Switcher */}
        <div className="mb-6 flex justify-center">
          <div className="inline-flex rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-1">
            <button
              onClick={() => setRole('technician')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                role === 'technician'
                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              Technician View
            </button>
            <button
              onClick={() => setRole('company')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                role === 'company'
                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              Company View
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6 sm:p-8 overflow-auto">
          {role === 'technician' ? (
            <PayoutSettings
              payoutMethods={payoutMethods}
              onAddBankAccount={handleAddBankAccount}
              onAddPayPal={handleAddPayPal}
              onRemoveMethod={handleRemovePayoutMethod}
              onSetDefaultMethod={handleSetDefaultPayoutMethod}
              isLoading={isLoading}
            />
          ) : (
            <BillingSettings
              billingInfo={billingInfo}
              subscriptionTier={subscriptionTier}
              onAddPaymentMethod={handleAddPaymentMethod}
              onRemovePaymentMethod={handleRemovePaymentMethod}
              onSetDefaultPaymentMethod={handleSetDefaultPaymentMethod}
              onUpdateBillingAddress={handleUpdateBillingAddress}
              onDownloadInvoice={handleDownloadInvoice}
              onUpgradeTier={handleUpgradeTier}
              isLoading={isLoading}
            />
          )}
        </div>

        {/* Preview Info */}
        <div className="mt-6 p-4 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            <strong>Preview Mode:</strong> This is a preview of the role-based payment settings.
            Switch between Technician and Company views to see the different payment management
            interfaces. All actions are simulated and data is stored locally.
          </p>
        </div>
      </div>
    </div>
  );
}
