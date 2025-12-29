import type { Dispute } from '../types';
import { AlertCircle, MessageSquare, CheckCircle2, Clock } from 'lucide-react';

interface DisputeCardProps {
  dispute: Dispute;
  onViewDetails?: (disputeId: string) => void;
}

export default function DisputeCard({ dispute, onViewDetails }: DisputeCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'self_resolution':
        return 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-100 border-amber-200 dark:border-amber-800';
      case 'mediation':
        return 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'arbitration':
        return 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      default:
        return 'bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300';
      case 'active':
        return 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-100';
      case 'under_review':
        return 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300';
      case 'awaiting_decision':
        return 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300';
      default:
        return 'bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300';
    }
  };

  const getCategoryLabel = (category: string) => {
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-950 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <div className="font-semibold text-zinc-900 dark:text-zinc-100">
              {getCategoryLabel(dispute.category)}
            </div>
            <div className="text-sm text-zinc-500 dark:text-zinc-400">
              Booking #{dispute.bookingId}
            </div>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(dispute.status)}`}>
          {dispute.status.replace('_', ' ').toUpperCase()}
        </div>
      </div>

      <div className="mb-4">
        <div className="text-sm text-zinc-700 dark:text-zinc-300 line-clamp-2">
          {dispute.description}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="text-xs text-zinc-500 dark:text-zinc-400">
          {dispute.initiatorName} ({dispute.initiatorType})
        </div>
        <div className="text-zinc-300 dark:text-zinc-700">→</div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400">
          {dispute.respondentName} ({dispute.respondentType})
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1">
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">Current Stage</div>
          <div className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${getStageColor(dispute.stage)}`}>
            {dispute.stage === 'self_resolution' && 'Self Resolution'}
            {dispute.stage === 'mediation' && 'Admin Mediation'}
            {dispute.stage === 'arbitration' && 'Formal Arbitration'}
          </div>
        </div>
        {dispute.mediatorName && (
          <div className="flex-1">
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">Mediator</div>
            <div className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {dispute.mediatorName}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 mb-1">
            <MessageSquare className="w-3 h-3" />
            Messages
          </div>
          <div className="font-semibold text-zinc-900 dark:text-zinc-100">
            {dispute.messages.length}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 mb-1">
            <Clock className="w-3 h-3" />
            Created
          </div>
          <div className="text-sm text-zinc-700 dark:text-zinc-300">
            {formatDate(dispute.createdAt)}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 mb-1">
            <Clock className="w-3 h-3" />
            Updated
          </div>
          <div className="text-sm text-zinc-700 dark:text-zinc-300">
            {formatDate(dispute.updatedAt)}
          </div>
        </div>
      </div>

      {dispute.resolution && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
            <div className="text-sm font-medium text-green-700 dark:text-green-300">
              Resolved
            </div>
          </div>
          <div className="text-xs text-green-700 dark:text-green-300 line-clamp-2">
            {dispute.resolution.decision}
          </div>
        </div>
      )}

      {onViewDetails && (
        <button
          onClick={() => onViewDetails(dispute.id)}
          className="mt-4 w-full px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm font-medium"
        >
          View Details
        </button>
      )}
    </div>
  );
}
