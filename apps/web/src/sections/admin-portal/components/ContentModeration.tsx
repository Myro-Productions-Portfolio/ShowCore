import { useState } from 'react';
import type {
  ContentModerationProps,
  ModerationStatus,
  ModerationAction,
  FlaggedContentType,
} from '../types';

export default function ContentModeration({
  flaggedContent,
  onReview,
  onDismiss,
  isLoading = false,
}: ContentModerationProps) {
  const [selectedStatus, setSelectedStatus] = useState<ModerationStatus | 'all'>('all');
  const [selectedType, setSelectedType] = useState<FlaggedContentType | 'all'>('all');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [actionNotes, setActionNotes] = useState<Record<string, string>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Calculate quick stats
  const stats = {
    pending: flaggedContent.filter((c) => c.status === 'pending').length,
    resolvedToday: flaggedContent.filter((c) => {
      if (c.status !== 'resolved' || !c.reviewedAt) return false;
      const today = new Date().toISOString().split('T')[0];
      const reviewDate = c.reviewedAt.split('T')[0];
      return today === reviewDate;
    }).length,
    avgResponseTime: '2.3 hours', // This would be calculated from actual data
  };

  // Filter content
  const filteredContent = flaggedContent.filter((content) => {
    const statusMatch = selectedStatus === 'all' || content.status === selectedStatus;
    const typeMatch = selectedType === 'all' || content.type === selectedType;
    return statusMatch && typeMatch;
  });

  // Get status badge color
  const getStatusColor = (status: ModerationStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'under_review':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'resolved':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'dismissed':
        return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  };

  // Get type badge color
  const getTypeColor = (type: FlaggedContentType) => {
    switch (type) {
      case 'review':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'profile':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'message':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'photo':
        return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
    }
  };

  // Handle action
  const handleAction = async (contentId: string, action: ModerationAction) => {
    setProcessingId(contentId);
    try {
      await onReview(contentId, action, actionNotes[contentId] || undefined);
      setActionNotes((prev) => {
        const next = { ...prev };
        delete next[contentId];
        return next;
      });
      setExpandedCard(null);
    } finally {
      setProcessingId(null);
    }
  };

  // Handle dismiss
  const handleDismiss = async (contentId: string) => {
    const reason = actionNotes[contentId] || 'No violation found';
    setProcessingId(contentId);
    try {
      await onDismiss(contentId, reason);
      setActionNotes((prev) => {
        const next = { ...prev };
        delete next[contentId];
        return next;
      });
      setExpandedCard(null);
    } finally {
      setProcessingId(null);
    }
  };

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            Content Moderation
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">Review and moderate flagged content</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
            <div className="text-zinc-600 dark:text-zinc-400 text-sm mb-1">Pending Review</div>
            <div className="text-3xl font-bold text-amber-400">{stats.pending}</div>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
            <div className="text-zinc-600 dark:text-zinc-400 text-sm mb-1">Resolved Today</div>
            <div className="text-3xl font-bold text-green-400">{stats.resolvedToday}</div>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
            <div className="text-zinc-600 dark:text-zinc-400 text-sm mb-1">Avg Response Time</div>
            <div className="text-3xl font-bold text-blue-400">{stats.avgResponseTime}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 mb-6">
          <div className="space-y-4">
            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">Status</label>
              <div className="flex flex-wrap gap-2">
                {(['all', 'pending', 'under_review', 'resolved', 'dismissed'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                      selectedStatus === status
                        ? 'bg-amber-500 text-zinc-950'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {status === 'all' ? 'All' : status.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">Content Type</label>
              <div className="flex flex-wrap gap-2">
                {(['all', 'review', 'profile', 'message', 'photo'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                      selectedType === type
                        ? 'bg-amber-500 text-zinc-950'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Content Queue */}
        {isLoading ? (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400"></div>
            <p className="text-zinc-600 dark:text-zinc-400 mt-4">Loading flagged content...</p>
          </div>
        ) : filteredContent.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-12 text-center">
            <p className="text-zinc-600 dark:text-zinc-400">No flagged content found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredContent.map((content) => {
              const isExpanded = expandedCard === content.id;
              const isProcessing = processingId === content.id;

              return (
                <div
                  key={content.id}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                >
                  <div className="p-6">
                    {/* Header Row */}
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                      <div className="flex flex-wrap gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getTypeColor(content.type)}`}>
                          {content.type.charAt(0).toUpperCase() + content.type.slice(1)}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(content.status)}`}>
                          {content.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-sm text-zinc-600 dark:text-zinc-400">{formatTime(content.createdAt)}</div>
                    </div>

                    {/* Content Preview */}
                    <div className="mb-4">
                      <div className="bg-gray-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
                        <div className="flex items-start gap-2 mb-2">
                          <svg className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <div className="text-sm text-amber-400 font-medium">Potentially Offensive Content</div>
                        </div>
                        {content.type === 'photo' && content.contentUrl ? (
                          <div className="space-y-2">
                            <img
                              src={content.contentUrl}
                              alt="Flagged content"
                              className="max-w-md rounded border border-zinc-300 dark:border-zinc-700"
                            />
                          </div>
                        ) : (
                          <div className="text-zinc-700 dark:text-zinc-300 text-sm italic border-l-2 border-zinc-300 dark:border-zinc-700 pl-4">
                            "{content.content}"
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {/* Reporter Info */}
                      <div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-1">Reported By</div>
                        <div className="text-sm text-zinc-800 dark:text-zinc-200">{content.reporter.name}</div>
                        <div className="text-xs text-zinc-600 dark:text-zinc-400">{content.reporter.email}</div>
                      </div>

                      {/* Reported User Info */}
                      <div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-1">Reported User</div>
                        <div className="text-sm text-zinc-800 dark:text-zinc-200">{content.reportedUser.name}</div>
                        <div className="text-xs text-zinc-600 dark:text-zinc-400">
                          {content.reportedUser.email} • {content.reportedUser.role}
                        </div>
                      </div>

                      {/* Reason */}
                      <div className="md:col-span-2">
                        <div className="text-xs text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-1">Reason</div>
                        <div className="text-sm text-zinc-800 dark:text-zinc-200">{content.reason}</div>
                        {content.additionalDetails && (
                          <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">{content.additionalDetails}</div>
                        )}
                      </div>

                      {/* Review Info (if reviewed) */}
                      {content.reviewedAt && (
                        <>
                          <div>
                            <div className="text-xs text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-1">Reviewed By</div>
                            <div className="text-sm text-zinc-800 dark:text-zinc-200">{content.reviewedBy || 'Unknown'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-1">Reviewed At</div>
                            <div className="text-sm text-zinc-800 dark:text-zinc-200">{formatTime(content.reviewedAt)}</div>
                          </div>
                          {content.actionNotes && (
                            <div className="md:col-span-2">
                              <div className="text-xs text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-1">Action Notes</div>
                              <div className="text-sm text-zinc-800 dark:text-zinc-200">{content.actionNotes}</div>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Action Panel (only for pending/under_review) */}
                    {(content.status === 'pending' || content.status === 'under_review') && (
                      <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 mt-4">
                        {/* Toggle Actions */}
                        {!isExpanded ? (
                          <button
                            onClick={() => setExpandedCard(content.id)}
                            className="w-full px-4 py-2 bg-amber-500 text-zinc-950 rounded-lg font-medium hover:bg-amber-400 transition-colors"
                          >
                            Take Action
                          </button>
                        ) : (
                          <div className="space-y-4">
                            {/* Notes Input */}
                            <div>
                              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">
                                Action Notes (Optional)
                              </label>
                              <textarea
                                value={actionNotes[content.id] || ''}
                                onChange={(e) =>
                                  setActionNotes((prev) => ({ ...prev, [content.id]: e.target.value }))
                                }
                                placeholder="Add notes about your decision..."
                                rows={3}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                                disabled={isProcessing}
                              />
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              <button
                                onClick={() => handleAction(content.id, 'approve')}
                                disabled={isProcessing}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleAction(content.id, 'remove')}
                                disabled={isProcessing}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                              >
                                Remove Content
                              </button>
                              <button
                                onClick={() => handleAction(content.id, 'warn_user')}
                                disabled={isProcessing}
                                className="px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                              >
                                Warn User
                              </button>
                              <button
                                onClick={() => handleAction(content.id, 'suspend_user')}
                                disabled={isProcessing}
                                className="px-4 py-2 bg-red-700 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                              >
                                Suspend User
                              </button>
                              <button
                                onClick={() => handleAction(content.id, 'edit_content')}
                                disabled={isProcessing}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                              >
                                Edit Content
                              </button>
                              <button
                                onClick={() => handleDismiss(content.id)}
                                disabled={isProcessing}
                                className="px-4 py-2 bg-zinc-700 text-zinc-200 rounded-lg font-medium hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                              >
                                Dismiss
                              </button>
                            </div>

                            {/* Cancel */}
                            <button
                              onClick={() => setExpandedCard(null)}
                              disabled={isProcessing}
                              className="w-full px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
