import { useState } from 'react';
import type {
  DisputeResolutionProps,
  DisputeStatus,
  DisputeType,
  DisputeResolution as DisputeResolutionType,
  DisputeMessage,
  DisputeEvidence,
} from '../types';

export default function DisputeResolution({
  disputes,
  onViewDispute,
  onAssignToSelf,
  onSendMessage,
  onResolveDispute,
  onEscalate,
  isLoading = false,
}: DisputeResolutionProps) {
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);
  const [mobileShowDetail, setMobileShowDetail] = useState(false);
  const [statusFilter, setStatusFilter] = useState<DisputeStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<DisputeType | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'status'>('date');

  // Message composition state
  const [messageText, setMessageText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Resolution form state
  const [showResolutionForm, setShowResolutionForm] = useState(false);
  const [resolutionOutcome, setResolutionOutcome] = useState<DisputeResolutionType['outcome']>('no_fault');
  const [refundAmount, setRefundAmount] = useState('');
  const [penaltyAmount, setPenaltyAmount] = useState('');
  const [appliedTo, setAppliedTo] = useState<'technician' | 'company' | 'both'>('technician');
  const [reasoning, setReasoning] = useState('');
  const [resolving, setResolving] = useState(false);

  // Escalation state
  const [showEscalationForm, setShowEscalationForm] = useState(false);
  const [escalationReason, setEscalationReason] = useState('');
  const [escalating, setEscalating] = useState(false);

  const selectedDispute = disputes.find((d) => d.id === selectedDisputeId);

  // Filter and sort disputes
  const filteredDisputes = disputes
    .filter((d) => statusFilter === 'all' || d.status === statusFilter)
    .filter((d) => typeFilter === 'all' || d.type === typeFilter)
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return a.status.localeCompare(b.status);
    });

  const handleSelectDispute = (disputeId: string) => {
    setSelectedDisputeId(disputeId);
    setMobileShowDetail(true);
    onViewDispute(disputeId);
    setShowResolutionForm(false);
    setShowEscalationForm(false);
  };

  const handleBackToList = () => {
    setMobileShowDetail(false);
  };

  const handleAssignToSelf = async () => {
    if (!selectedDisputeId) return;
    try {
      await onAssignToSelf(selectedDisputeId);
    } catch (error) {
      console.error('Failed to assign dispute:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedDisputeId || !messageText.trim()) return;
    setSendingMessage(true);
    try {
      await onSendMessage(selectedDisputeId, messageText, isInternalNote);
      setMessageText('');
      setIsInternalNote(false);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleResolveDispute = async () => {
    if (!selectedDisputeId || !reasoning.trim()) return;
    setResolving(true);
    try {
      const resolution: DisputeResolutionType = {
        outcome: resolutionOutcome,
        ...(refundAmount && { refundAmount: parseFloat(refundAmount) }),
        ...(penaltyAmount && { penaltyAmount: parseFloat(penaltyAmount) }),
        appliedTo,
        reasoning,
        resolvedBy: 'current-admin-id',
        resolvedAt: new Date().toISOString(),
      };
      await onResolveDispute(selectedDisputeId, resolution);
      setShowResolutionForm(false);
      setReasoning('');
      setRefundAmount('');
      setPenaltyAmount('');
    } catch (error) {
      console.error('Failed to resolve dispute:', error);
    } finally {
      setResolving(false);
    }
  };

  const handleEscalate = async () => {
    if (!selectedDisputeId || !escalationReason.trim()) return;
    setEscalating(true);
    try {
      await onEscalate(selectedDisputeId, escalationReason);
      setShowEscalationForm(false);
      setEscalationReason('');
    } catch (error) {
      console.error('Failed to escalate dispute:', error);
    } finally {
      setEscalating(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-50 dark:bg-zinc-950 relative overflow-hidden">
      {/* Left Panel - Dispute List - Always visible */}
      <div className="w-full lg:w-96 border-r border-zinc-200 dark:border-zinc-800 flex flex-col bg-white dark:bg-zinc-900">
        {/* Filters */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 space-y-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Disputes</h2>

          <div className="space-y-2">
            <label className="block text-sm text-zinc-600 dark:text-zinc-400">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as DisputeStatus | 'all')}
              className="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="under_review">Under Review</option>
              <option value="awaiting_response">Awaiting Response</option>
              <option value="resolved">Resolved</option>
              <option value="escalated">Escalated</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm text-zinc-600 dark:text-zinc-400">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as DisputeType | 'all')}
              className="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Types</option>
              <option value="payment_issue">Payment Issue</option>
              <option value="no_show">No Show</option>
              <option value="quality_complaint">Quality Complaint</option>
              <option value="equipment_damage">Equipment Damage</option>
              <option value="breach_of_terms">Breach of Terms</option>
              <option value="cancellation_fee">Cancellation Fee</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm text-zinc-600 dark:text-zinc-400">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'status')}
              className="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="date">Date (Newest First)</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>

        {/* Dispute List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center text-zinc-500 dark:text-zinc-500">Loading disputes...</div>
          ) : filteredDisputes.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 dark:text-zinc-500">No disputes found</div>
          ) : (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredDisputes.map((dispute) => (
                <button
                  key={dispute.id}
                  onClick={() => handleSelectDispute(dispute.id)}
                  className={`w-full p-4 text-left transition-colors ${
                    selectedDisputeId === dispute.id
                      ? 'bg-zinc-100 dark:bg-zinc-800'
                      : 'hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-zinc-900 dark:text-white">
                        Dispute #{dispute.id.slice(0, 8)}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-500">
                        Booking #{dispute.bookingId.slice(0, 8)}
                      </div>
                    </div>
                    <DisputeStatusBadge status={dispute.status} />
                  </div>

                  <DisputeTypeBadge type={dispute.type} />

                  <div className="mt-3 space-y-1">
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">
                      <span className="font-medium">Tech:</span> {dispute.parties.technician.name}
                    </div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">
                      <span className="font-medium">Co:</span> {dispute.parties.company.name}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-500">
                    <div>{new Date(dispute.createdAt).toLocaleDateString()}</div>
                    {dispute.assignedAdmin && (
                      <div className="text-amber-500">Assigned</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Dispute Detail (Desktop: side panel, Mobile: overlay) */}

      {/* Mobile Overlay Backdrop */}
      {mobileShowDetail && selectedDispute && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40"
          onClick={handleBackToList}
        />
      )}

      {/* Detail Panel */}
      <div className={`
        flex-1 flex-col bg-gray-50 dark:bg-zinc-950
        lg:flex lg:relative lg:z-auto
        ${mobileShowDetail && selectedDispute
          ? 'fixed inset-x-0 bottom-0 top-16 z-50 flex rounded-t-2xl shadow-2xl lg:rounded-none lg:shadow-none lg:inset-auto'
          : 'hidden lg:flex'
        }
      `}>
        {selectedDispute ? (
          <>
            {/* Mobile drag handle */}
            <div className="lg:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-zinc-300 dark:bg-zinc-600 rounded-full" />
            </div>

            {/* Header */}
            <div className="p-4 lg:p-6 border-b border-zinc-200 dark:border-zinc-800">
              {/* Mobile close button */}
              <div className="lg:hidden flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Dispute Details</span>
                <button
                  onClick={handleBackToList}
                  className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                    Dispute #{selectedDispute.id.slice(0, 8)}
                  </h1>
                  <div className="flex items-center gap-3">
                    <DisputeStatusBadge status={selectedDispute.status} size="lg" />
                    <DisputeTypeBadge type={selectedDispute.type} />
                  </div>
                </div>

                {!selectedDispute.assignedAdmin && (
                  <button
                    onClick={handleAssignToSelf}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Assign to Self
                  </button>
                )}
              </div>

              <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
                <div>Booking ID: {selectedDispute.bookingId}</div>
                <div>Created: {new Date(selectedDispute.createdAt).toLocaleString()}</div>
                <div>Last Updated: {new Date(selectedDispute.lastUpdatedAt).toLocaleString()}</div>
                {selectedDispute.assignedAdmin && (
                  <div className="text-amber-500">Assigned to: {selectedDispute.assignedAdmin}</div>
                )}
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Description */}
              <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">Description</h3>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  {selectedDispute.description}
                </p>
              </div>

              {/* Parties */}
              <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Parties Involved</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <div className="text-xs font-medium text-zinc-500 dark:text-zinc-500 uppercase mb-2">Technician</div>
                    <div className="text-sm font-medium text-zinc-900 dark:text-white mb-1">
                      {selectedDispute.parties.technician.name}
                    </div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">
                      {selectedDispute.parties.technician.email}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-zinc-500 dark:text-zinc-500 uppercase mb-2">Company</div>
                    <div className="text-sm font-medium text-zinc-900 dark:text-white mb-1">
                      {selectedDispute.parties.company.name}
                    </div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">
                      {selectedDispute.parties.company.email}
                    </div>
                  </div>
                </div>
              </div>

              {/* Evidence */}
              {selectedDispute.evidence.length > 0 && (
                <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Evidence</h3>
                  <div className="space-y-3">
                    {selectedDispute.evidence.map((evidence, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg"
                      >
                        <EvidenceIcon type={evidence.type} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-zinc-900 dark:text-white mb-1">
                            {evidence.description}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-500">
                            <span>Uploaded by {evidence.uploadedBy}</span>
                            <span>•</span>
                            <span>{new Date(evidence.uploadedAt).toLocaleString()}</span>
                          </div>
                          {evidence.url && (
                            <a
                              href={evidence.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-amber-500 hover:text-amber-400 mt-1 inline-block"
                            >
                              View attachment →
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Message Thread */}
              <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Message Thread</h3>
                <div className="space-y-4 mb-4">
                  {selectedDispute.messages.length === 0 ? (
                    <div className="text-sm text-zinc-500 dark:text-zinc-500 text-center py-4">
                      No messages yet
                    </div>
                  ) : (
                    selectedDispute.messages.map((message) => (
                      <MessageBubble key={message.id} message={message} />
                    ))
                  )}
                </div>

                {/* Message Composer */}
                <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type your message..."
                    rows={3}
                    className="w-full px-4 py-3 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isInternalNote}
                        onChange={(e) => setIsInternalNote(e.target.checked)}
                        className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-amber-600 focus:ring-2 focus:ring-amber-500"
                      />
                      Internal admin note (not visible to parties)
                    </label>
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageText.trim() || sendingMessage}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-zinc-200 dark:disabled:bg-zinc-700 disabled:text-zinc-500 dark:disabled:text-zinc-500 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      {sendingMessage ? 'Sending...' : 'Send Message'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Resolution */}
              {selectedDispute.resolution && (
                <div className="bg-green-950 border border-green-800 rounded-lg p-6">
                  <h3 className="text-sm font-semibold text-green-400 mb-4">Resolution</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-300">Outcome:</span>
                      <span className="text-white font-medium">
                        {selectedDispute.resolution.outcome.replace(/_/g, ' ')}
                      </span>
                    </div>
                    {selectedDispute.resolution.refundAmount && (
                      <div className="flex justify-between">
                        <span className="text-green-300">Refund Amount:</span>
                        <span className="text-white font-medium">
                          ${selectedDispute.resolution.refundAmount.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {selectedDispute.resolution.penaltyAmount && (
                      <div className="flex justify-between">
                        <span className="text-green-300">Penalty Amount:</span>
                        <span className="text-white font-medium">
                          ${selectedDispute.resolution.penaltyAmount.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {selectedDispute.resolution.appliedTo && (
                      <div className="flex justify-between">
                        <span className="text-green-300">Applied To:</span>
                        <span className="text-white font-medium">
                          {selectedDispute.resolution.appliedTo}
                        </span>
                      </div>
                    )}
                    <div className="pt-3 border-t border-green-800">
                      <div className="text-green-300 mb-2">Reasoning:</div>
                      <div className="text-white leading-relaxed">
                        {selectedDispute.resolution.reasoning}
                      </div>
                    </div>
                    <div className="text-xs text-green-400 pt-2">
                      Resolved by {selectedDispute.resolution.resolvedBy} on{' '}
                      {new Date(selectedDispute.resolution.resolvedAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Bar */}
            {selectedDispute.status !== 'resolved' && (
              <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                {showResolutionForm ? (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Resolve Dispute</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-zinc-600 dark:text-zinc-400 mb-2">Outcome</label>
                        <select
                          value={resolutionOutcome}
                          onChange={(e) => setResolutionOutcome(e.target.value as DisputeResolutionType['outcome'])}
                          className="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                          <option value="technician_favor">Technician Favor</option>
                          <option value="company_favor">Company Favor</option>
                          <option value="split">Split Decision</option>
                          <option value="no_fault">No Fault</option>
                          <option value="both_penalized">Both Penalized</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-zinc-600 dark:text-zinc-400 mb-2">Applied To</label>
                        <select
                          value={appliedTo}
                          onChange={(e) => setAppliedTo(e.target.value as 'technician' | 'company' | 'both')}
                          className="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                          <option value="technician">Technician</option>
                          <option value="company">Company</option>
                          <option value="both">Both</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-zinc-600 dark:text-zinc-400 mb-2">Refund Amount ($)</label>
                        <input
                          type="number"
                          value={refundAmount}
                          onChange={(e) => setRefundAmount(e.target.value)}
                          placeholder="0.00"
                          step="0.01"
                          className="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-zinc-600 dark:text-zinc-400 mb-2">Penalty Amount ($)</label>
                        <input
                          type="number"
                          value={penaltyAmount}
                          onChange={(e) => setPenaltyAmount(e.target.value)}
                          placeholder="0.00"
                          step="0.01"
                          className="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-zinc-600 dark:text-zinc-400 mb-2">Reasoning *</label>
                      <textarea
                        value={reasoning}
                        onChange={(e) => setReasoning(e.target.value)}
                        placeholder="Provide detailed reasoning for this resolution..."
                        rows={4}
                        className="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={handleResolveDispute}
                        disabled={!reasoning.trim() || resolving}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-zinc-200 dark:disabled:bg-zinc-700 disabled:text-zinc-500 dark:disabled:text-zinc-500 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        {resolving ? 'Resolving...' : 'Confirm Resolution'}
                      </button>
                      <button
                        onClick={() => setShowResolutionForm(false)}
                        className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-900 dark:text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : showEscalationForm ? (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Escalate Dispute</h3>

                    <div>
                      <label className="block text-xs text-zinc-600 dark:text-zinc-400 mb-2">Escalation Reason *</label>
                      <textarea
                        value={escalationReason}
                        onChange={(e) => setEscalationReason(e.target.value)}
                        placeholder="Explain why this dispute needs to be escalated..."
                        rows={4}
                        className="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={handleEscalate}
                        disabled={!escalationReason.trim() || escalating}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-zinc-200 dark:disabled:bg-zinc-700 disabled:text-zinc-500 dark:disabled:text-zinc-500 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        {escalating ? 'Escalating...' : 'Confirm Escalation'}
                      </button>
                      <button
                        onClick={() => setShowEscalationForm(false)}
                        className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-900 dark:text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => setShowResolutionForm(true)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Resolve Dispute
                    </button>
                    <button
                      onClick={() => setShowEscalationForm(true)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Escalate
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-zinc-500 dark:text-zinc-500">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-zinc-300 dark:text-zinc-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-lg font-medium mb-1">No dispute selected</p>
              <p className="text-sm">Select a dispute from the list to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Status Badge Component
function DisputeStatusBadge({ status, size = 'sm' }: { status: DisputeStatus; size?: 'sm' | 'lg' }) {
  const colors = {
    open: 'bg-blue-600 text-blue-100',
    under_review: 'bg-amber-600 text-amber-100',
    awaiting_response: 'bg-yellow-600 text-yellow-100',
    resolved: 'bg-green-600 text-green-100',
    escalated: 'bg-red-600 text-red-100',
  };

  const sizeClasses = size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${colors[status]} ${sizeClasses}`}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}

// Type Badge Component
function DisputeTypeBadge({ type }: { type: DisputeType }) {
  const labels = {
    payment_issue: 'Payment',
    no_show: 'No Show',
    quality_complaint: 'Quality',
    equipment_damage: 'Damage',
    breach_of_terms: 'Terms',
    cancellation_fee: 'Cancellation',
    other: 'Other',
  };

  return (
    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
      {labels[type]}
    </span>
  );
}

// Evidence Icon Component
function EvidenceIcon({ type }: { type: DisputeEvidence['type'] }) {
  const icons = {
    message: (
      <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
    photo: (
      <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    document: (
      <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    booking_details: (
      <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    payment_record: (
      <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  };

  return icons[type];
}

// Message Bubble Component
function MessageBubble({ message }: { message: DisputeMessage }) {
  const isAdmin = message.sender === 'admin';
  const isInternal = message.isInternal;

  return (
    <div
      className={`p-4 rounded-lg ${
        isInternal
          ? 'bg-amber-950 border border-amber-800'
          : isAdmin
          ? 'bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700'
          : 'bg-zinc-100/50 dark:bg-zinc-800/50 border border-zinc-300/50 dark:border-zinc-700/50'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-900 dark:text-white">{message.senderName}</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              isAdmin ? 'bg-amber-600 text-amber-100' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
            }`}
          >
            {message.sender}
          </span>
          {isInternal && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-600 text-amber-100">
              Internal
            </span>
          )}
        </div>
        <span className="text-xs text-zinc-500 dark:text-zinc-500">
          {new Date(message.timestamp).toLocaleString()}
        </span>
      </div>
      <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{message.content}</p>
      {message.attachments && message.attachments.length > 0 && (
        <div className="mt-3 flex gap-2">
          {message.attachments.map((attachment, idx) => (
            <a
              key={idx}
              href={attachment}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-amber-500 hover:text-amber-400"
            >
              Attachment {idx + 1} →
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
