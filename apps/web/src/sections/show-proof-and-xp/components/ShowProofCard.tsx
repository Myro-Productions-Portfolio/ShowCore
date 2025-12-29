import React from 'react';
import type { ShowProofCardProps } from '../types';

const ShowProofCard: React.FC<ShowProofCardProps> = ({ showProof, onView, onEdit, onDelete }) => {
  const statusColors = {
    pending_ai: 'bg-amber-500/10 text-amber-800 dark:text-amber-100 border-amber-500/20',
    pending_admin: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-300 border-yellow-500/20',
    approved: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
    rejected: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  };

  const statusLabels = {
    pending_ai: 'AI Review',
    pending_admin: 'Admin Review',
    approved: 'Approved',
    rejected: 'Rejected',
  };

  const privacyIcons = {
    public: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    private: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    clients_only: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  };

  const privacyLabels = {
    public: 'Public',
    private: 'Private',
    clients_only: 'Clients Only',
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden hover:border-amber-500/30 dark:hover:border-amber-500/30 transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/5">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
        {showProof.mediaUrls.length > 0 ? (
          <img
            src={showProof.mediaUrls[0]}
            alt={showProof.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-400 dark:text-zinc-600">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Status badge overlay */}
        <div className="absolute top-3 left-3">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border rounded-full backdrop-blur-sm ${statusColors[showProof.status]}`}>
            {statusLabels[showProof.status]}
          </span>
        </div>

        {/* Privacy indicator overlay */}
        <div className="absolute top-3 right-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black/40 backdrop-blur-sm text-white text-xs font-medium rounded-full">
            {privacyIcons[showProof.privacy]}
            <span>{privacyLabels[showProof.privacy]}</span>
          </div>
        </div>

        {/* XP Badge */}
        {showProof.xpAwarded && (
          <div className="absolute bottom-3 right-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500 text-white text-sm font-bold rounded-full shadow-lg">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
              {showProof.xpAwarded.totalXp} XP
            </div>
          </div>
        )}

        {/* Client Verification Badge */}
        {showProof.clientVerification.verified && (
          <div className="absolute bottom-3 left-3">
            <div className="flex items-center gap-1 px-2 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Verified
            </div>
          </div>
        )}

        {/* Media count indicator */}
        {showProof.mediaUrls.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
            <div className="flex items-center gap-1 px-2 py-1 bg-black/40 backdrop-blur-sm text-white text-xs font-medium rounded-full">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {showProof.mediaUrls.length}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-1.5 line-clamp-1 group-hover:text-amber-800 dark:group-hover:text-amber-100 transition-colors">
          {showProof.title}
        </h3>

        <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 mb-3">
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">{showProof.venue}</span>
          </div>
          <span className="text-zinc-400 dark:text-zinc-600">•</span>
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatDate(showProof.eventDate)}
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium rounded">
            {showProof.role}
          </span>
          {showProof.complexity === 'complex' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 text-amber-800 dark:text-amber-100 text-xs font-medium rounded border border-amber-500/20">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
              Complex
            </span>
          )}
        </div>

        {/* Star Rating */}
        {showProof.clientVerification.verified && showProof.clientVerification.starRating && (
          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className={`w-4 h-4 ${
                  star <= showProof.clientVerification.starRating!
                    ? 'text-amber-500 fill-current'
                    : 'text-zinc-300 dark:text-zinc-700'
                }`}
                viewBox="0 0 24 24"
              >
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            ))}
          </div>
        )}

        {/* Equipment Tags */}
        {showProof.aiAnalysis && showProof.aiAnalysis.detectedEquipment.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {showProof.aiAnalysis.detectedEquipment.slice(0, 3).map((equipment, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs rounded"
              >
                {equipment}
              </span>
            ))}
            {showProof.aiAnalysis.detectedEquipment.length > 3 && (
              <span className="inline-flex items-center px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs rounded">
                +{showProof.aiAnalysis.detectedEquipment.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => onView(showProof.id)}
            className="flex-1 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded transition-colors"
          >
            View
          </button>
          <button
            onClick={() => onEdit(showProof.id)}
            className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-medium rounded transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(showProof.id)}
            className="px-3 py-2 bg-zinc-100 hover:bg-red-50 dark:bg-zinc-800 dark:hover:bg-red-900/20 text-zinc-700 hover:text-red-600 dark:text-zinc-300 dark:hover:text-red-400 text-sm font-medium rounded transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShowProofCard;
