import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import type { ShowProofDetailProps } from '../types';

const ShowProofDetail: React.FC<ShowProofDetailProps> = ({ showProof, onEdit, onDelete, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const statusColors = {
    pending_ai: 'bg-amber-500/10 text-amber-800 dark:text-amber-100 border-amber-500/20',
    pending_admin: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-300 border-yellow-500/20',
    approved: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
    rejected: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  };

  const statusLabels = {
    pending_ai: 'Awaiting AI Analysis',
    pending_admin: 'Awaiting Admin Review',
    approved: 'Approved',
    rejected: 'Rejected',
  };

  const privacyLabels = {
    public: 'Public',
    private: 'Private',
    clients_only: 'Clients Only',
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % showProof.mediaUrls.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + showProof.mediaUrls.length) % showProof.mediaUrls.length);
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      ariaLabel={`Show Proof: ${showProof.title}`}
      backdropClassName="backdrop-blur-sm animate-in fade-in duration-200"
      className="w-full max-w-4xl mx-4"
    >
      <div className="bg-white dark:bg-zinc-900 rounded-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 p-6 z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                {showProof.title}
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium border rounded-full ${statusColors[showProof.status]}`}>
                  {statusLabels[showProof.status]}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium rounded-full">
                  {privacyLabels[showProof.privacy]}
                </span>
                {showProof.complexity === 'complex' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500/10 text-amber-800 dark:text-amber-100 text-xs font-medium rounded-full border border-amber-500/20">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                    </svg>
                    Complex Show
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 ml-4 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-zinc-500 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Image Gallery */}
          {showProof.mediaUrls.length > 0 && (
            <div className="space-y-3">
              <div className="relative aspect-video bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden group">
                <img
                  src={showProof.mediaUrls[currentImageIndex]}
                  alt={`${showProof.title} - Image ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setIsLightboxOpen(true)}
                />

                {showProof.mediaUrls.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {showProof.mediaUrls.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            index === currentImageIndex
                              ? 'bg-white w-6'
                              : 'bg-white/50 hover:bg-white/75'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnail strip */}
              {showProof.mediaUrls.length > 1 && (
                <div className="grid grid-cols-6 gap-2">
                  {showProof.mediaUrls.map((url, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`aspect-video bg-zinc-100 dark:bg-zinc-800 rounded overflow-hidden border-2 transition-all ${
                        index === currentImageIndex
                          ? 'border-amber-500'
                          : 'border-transparent hover:border-zinc-300 dark:hover:border-zinc-600'
                      }`}
                    >
                      <img src={url} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Event Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1">Venue</div>
              <div className="text-base text-zinc-900 dark:text-zinc-100">{showProof.venue}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1">Event Type</div>
              <div className="text-base text-zinc-900 dark:text-zinc-100 capitalize">{showProof.eventType}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1">Event Date</div>
              <div className="text-base text-zinc-900 dark:text-zinc-100">{formatDate(showProof.eventDate)}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1">Role</div>
              <div className="text-base text-zinc-900 dark:text-zinc-100">{showProof.role}</div>
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">Description</div>
            <p className="text-base text-zinc-900 dark:text-zinc-100 leading-relaxed whitespace-pre-wrap">
              {showProof.description}
            </p>
          </div>

          {/* AI Analysis */}
          {showProof.aiAnalysis && (
            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                AI Analysis Results
                <span className="ml-auto text-xs font-normal text-zinc-600 dark:text-zinc-400">
                  {Math.round(showProof.aiAnalysis.confidence * 100)}% confidence
                </span>
              </h3>

              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">Detected Equipment</div>
                  <div className="flex flex-wrap gap-2">
                    {showProof.aiAnalysis.detectedEquipment.map((equipment, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-1 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm rounded border border-zinc-200 dark:border-zinc-700"
                      >
                        {equipment}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1">Venue Type</div>
                    <div className="text-sm text-zinc-900 dark:text-zinc-100 capitalize">
                      {showProof.aiAnalysis.venueType.replace(/_/g, ' ')}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1">Estimated Scale</div>
                    <div className="text-sm text-zinc-900 dark:text-zinc-100 capitalize">
                      {showProof.aiAnalysis.estimatedAttendance.replace(/_/g, ' ')}
                    </div>
                  </div>
                </div>

                {showProof.aiAnalysis.flags.length > 0 && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-3">
                    <div className="text-sm font-medium text-yellow-700 dark:text-yellow-400 mb-1">Flags</div>
                    <ul className="space-y-1">
                      {showProof.aiAnalysis.flags.map((flag, index) => (
                        <li key={index} className="text-sm text-yellow-600 dark:text-yellow-300">
                          • {flag.replace(/_/g, ' ')}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Client Verification */}
          {showProof.clientVerification.verified && (
            <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <h3 className="font-bold text-green-900 dark:text-green-100 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Client Verification
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-green-800 dark:text-green-200">
                      {showProof.clientVerification.verifiedBy}
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-400">
                      Verified on {formatDate(showProof.clientVerification.verifiedDate!)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-5 h-5 ${
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
                </div>

                {showProof.clientVerification.feedback && (
                  <div>
                    <div className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">Feedback</div>
                    <p className="text-sm text-green-700 dark:text-green-300 italic">
                      "{showProof.clientVerification.feedback}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* XP Breakdown */}
          {showProof.xpAwarded && (
            <div className="bg-amber-50 dark:bg-amber-900/10 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
              <h3 className="font-bold text-amber-900 dark:text-amber-100 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
                XP Earned
              </h3>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-amber-800 dark:text-amber-100">Base XP</span>
                  <span className="font-semibold text-amber-900 dark:text-amber-100">
                    +{showProof.xpAwarded.baseXp} XP
                  </span>
                </div>

                {showProof.xpAwarded.bonuses.map((bonus, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-amber-800 dark:text-amber-100">{bonus.reason}</span>
                    <span className="font-semibold text-amber-900 dark:text-amber-100">
                      +{bonus.amount} XP
                    </span>
                  </div>
                ))}

                <div className="pt-2 mt-2 border-t border-amber-300 dark:border-amber-700 flex items-center justify-between">
                  <span className="font-bold text-amber-900 dark:text-amber-100">Total XP</span>
                  <span className="text-xl font-bold text-amber-800 dark:text-amber-100">
                    +{showProof.xpAwarded.totalXp} XP
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Rejection Reason */}
          {showProof.status === 'rejected' && showProof.rejectionReason && (
            <div className="bg-red-50 dark:bg-red-900/10 rounded-lg p-4 border border-red-200 dark:border-red-800">
              <h3 className="font-bold text-red-900 dark:text-red-100 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Rejection Reason
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300">
                {showProof.rejectionReason}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 p-6">
          <div className="flex items-center gap-3">
            <button
              onClick={onEdit}
              className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors"
            >
              Edit Show Proof
            </button>
            <button
              onClick={onDelete}
              className="px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
            >
              Delete
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {isLightboxOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsLightboxOpen(false)}
          ariaLabel={`Image: ${showProof.title}`}
          backdropClassName="bg-black/90"
        >
          <div className="relative">
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute -top-12 right-0 w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={showProof.mediaUrls[currentImageIndex]}
              alt={showProof.title}
              className="max-w-full max-h-[80vh] object-contain"
            />
          </div>
        </Modal>
      )}
    </Modal>
  );
};

export default ShowProofDetail;
