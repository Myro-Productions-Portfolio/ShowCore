import { useState } from 'react';
import type {
  User,
  Contract,
  Deposit,
  TimeEntry,
  Invoice,
  Message,
  Booking,
} from '../types';
import { MessageThread } from './MessageThread';

interface BookingDetailProps {
  booking: Booking;
  client?: User;
  technician?: User;
  contract?: Contract;
  deposit?: Deposit;
  timeEntries?: TimeEntry[];
  invoices?: Invoice[];
  messages?: Message[];
  users: User[];
  currentUserId: string;
  currentUserRole: 'client' | 'technician';
  onClose?: () => void;
  onSignContract?: () => void;
  onSubmitDeposit?: () => void;
  onApproveTimeEntry?: (timeEntryId: string) => void;
  onDisputeTimeEntry?: (timeEntryId: string) => void;
  onPayInvoice?: (invoiceId: string) => void;
  onSendMessage?: (content: string) => void;
  onCancelBooking?: () => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
    case 'confirmed':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    case 'in-progress':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    case 'completed':
      return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-300';
    case 'cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    default:
      return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-300';
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

const formatDateShort = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

export function BookingDetail({
  booking,
  client,
  technician,
  contract,
  deposit,
  timeEntries = [],
  invoices = [],
  messages = [],
  users,
  currentUserId,
  currentUserRole,
  onClose,
  onSignContract,
  onSubmitDeposit,
  onApproveTimeEntry,
  onDisputeTimeEntry,
  onPayInvoice,
  onSendMessage,
  onCancelBooking,
}: BookingDetailProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'contract' | 'time' | 'invoice' | 'messages'>('details');

  const otherUser = currentUserRole === 'client' ? technician : client;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            {otherUser && (
              <img
                src={otherUser.avatar}
                alt={otherUser.name}
                className="w-14 h-14 rounded-full ring-2 ring-zinc-100 dark:ring-zinc-800"
              />
            )}
            <div className="flex-1 min-w-0">
              {otherUser && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                  {currentUserRole === 'client' ? 'Technician' : 'Client'}: {otherUser.name}
                </p>
              )}
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                {booking.title}
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 mt-1">
                {booking.serviceType}
              </p>
            </div>
            <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1).replace('-', ' ')}
            </span>
          </div>

          <button
            onClick={onClose}
            className="ml-4 p-2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 border-b border-zinc-200 dark:border-zinc-800">
          {['details', 'contract', 'time', 'invoice', 'messages'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2.5 rounded-t-lg font-medium text-sm transition-colors ${
                activeTab === tab
                  ? 'bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 border-b-2 border-amber-600 dark:border-amber-400'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
              }`}
            >
              {tab === 'details' && 'Details'}
              {tab === 'contract' && 'Contract'}
              {tab === 'time' && `Time (${timeEntries.length})`}
              {tab === 'invoice' && `Invoices (${invoices.length})`}
              {tab === 'messages' && `Messages (${messages.length})`}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'details' && (
            <div className="p-6 space-y-6">
              {/* Key Info Grid */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400 block mb-2">
                    Date & Time
                  </label>
                  <p className="text-zinc-900 dark:text-zinc-100">
                    {formatDate(booking.startDate)}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                    to {formatDate(booking.endDate)}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400 block mb-2">
                    Duration
                  </label>
                  <p className="text-zinc-900 dark:text-zinc-100">
                    {booking.estimatedDuration} hours
                  </p>
                </div>

                <div className="col-span-2">
                  <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400 block mb-2">
                    Location
                  </label>
                  <p className="text-zinc-900 dark:text-zinc-100">
                    {booking.location}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400 block mb-2">
                    Rate
                  </label>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    ${booking.agreedRate || booking.budgetMax || 0}
                    <span className="text-sm font-normal text-zinc-500">/hr</span>
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400 block mb-2">
                    Total Estimate
                  </label>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    ${booking.totalEstimate || 0}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400 block mb-2">
                  Description
                </label>
                <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  {booking.description}
                </p>
              </div>

              {/* Deposit Status */}
              {deposit && (
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                      Deposit ({deposit.percentage}%)
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      deposit.status === 'paid'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : deposit.status === 'refunded'
                        ? 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                    }`}>
                      {deposit.status.charAt(0).toUpperCase() + deposit.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                      ${deposit.amount}
                    </span>
                    {deposit.status === 'pending' && (
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        due by {formatDateShort(deposit.dueDate)}
                      </span>
                    )}
                  </div>
                  {deposit.status === 'pending' && currentUserRole === 'client' && (
                    <button
                      onClick={onSubmitDeposit}
                      className="w-full px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors"
                    >
                      Submit Deposit Payment
                    </button>
                  )}
                </div>
              )}

              {/* Cancellation Policy */}
              <div>
                <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400 block mb-2">
                  Cancellation Policy
                </label>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  {booking.cancellationPolicy}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'contract' && (
            <div className="p-6">
              {contract ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                      {contract.title}
                    </h3>
                    <div className="space-y-4 text-sm">
                      <div>
                        <h4 className="font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Scope</h4>
                        <p className="text-zinc-600 dark:text-zinc-400 whitespace-pre-line leading-relaxed">
                          {contract.scope}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Terms</h4>
                        <p className="text-zinc-600 dark:text-zinc-400 whitespace-pre-line leading-relaxed">
                          {contract.terms}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Deliverables</h4>
                        <p className="text-zinc-600 dark:text-zinc-400 whitespace-pre-line leading-relaxed">
                          {contract.deliverables}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Signatures */}
                  <div className="grid grid-cols-2 gap-4 pt-6 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                        Technician Signature
                      </p>
                      {contract.technicianSignature?.signed ? (
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm font-medium">Signed</span>
                        </div>
                      ) : (
                        <p className="text-sm text-zinc-500">Pending</p>
                      )}
                    </div>
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                        Client Signature
                      </p>
                      {contract.clientSignature?.signed ? (
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm font-medium">Signed</span>
                        </div>
                      ) : (
                        <p className="text-sm text-zinc-500">Pending</p>
                      )}
                    </div>
                  </div>

                  {/* Sign Button */}
                  {contract.status !== 'signed' && (
                    <button
                      onClick={onSignContract}
                      className="w-full px-4 py-3 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors"
                    >
                      Sign Contract
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-zinc-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400">No contract yet</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'time' && (
            <div className="p-6">
              {timeEntries.length > 0 ? (
                <div className="space-y-3">
                  {timeEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {new Date(entry.date).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            {entry.duration} hours
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          entry.status === 'approved'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : entry.status === 'disputed'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                        }`}>
                          {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-3">
                        {entry.notes}
                      </p>
                      {entry.status === 'pending' && currentUserRole === 'client' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => onApproveTimeEntry?.(entry.id)}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => onDisputeTimeEntry?.(entry.id)}
                            className="px-3 py-1.5 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300 text-sm font-medium rounded-lg transition-colors"
                          >
                            Dispute
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-zinc-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400">No time entries yet</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'invoice' && (
            <div className="p-6">
              {invoices.length > 0 ? (
                <div className="space-y-4">
                  {invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="p-5 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="font-bold text-lg text-zinc-900 dark:text-zinc-100">
                            {invoice.invoiceNumber}
                          </p>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            Issued: {formatDateShort(invoice.issueDate)}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          invoice.status === 'paid'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : invoice.status === 'overdue'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                        }`}>
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </span>
                      </div>

                      <div className="space-y-2 mb-4 text-sm">
                        {invoice.lineItems.map((item, index) => (
                          <div key={index} className="flex justify-between">
                            <span className="text-zinc-700 dark:text-zinc-300">
                              {item.description} ({item.quantity} hrs)
                            </span>
                            <span className="font-medium text-zinc-900 dark:text-zinc-100">
                              ${item.amount}
                            </span>
                          </div>
                        ))}
                        {invoice.depositDeduction < 0 && (
                          <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                            <span>Deposit Deduction</span>
                            <span>${invoice.depositDeduction}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700">
                        <div className="flex justify-between items-baseline">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100">Total</span>
                          <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                            ${invoice.total}
                          </span>
                        </div>
                      </div>

                      {invoice.status !== 'paid' && currentUserRole === 'client' && (
                        <button
                          onClick={() => onPayInvoice?.(invoice.id)}
                          className="w-full mt-4 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors"
                        >
                          Pay Invoice
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-zinc-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400">No invoices yet</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'messages' && (
            <MessageThread
              messages={messages}
              users={users}
              currentUserId={currentUserId}
              onSendMessage={onSendMessage}
            />
          )}
        </div>

        {/* Footer Actions */}
        {booking.status !== 'cancelled' && booking.status !== 'completed' && (
          <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3">
            <button
              onClick={onCancelBooking}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
            >
              Cancel Booking
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
