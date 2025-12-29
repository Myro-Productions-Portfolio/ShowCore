import { useState } from 'react';
import type { ReviewsAndTrustProps } from '../types';
import ReviewCard from './ReviewCard';
import ReviewStats from './ReviewStats';
import TrustProfile from './TrustProfile';
import DisputeCard from './DisputeCard';
import { Star, Shield, AlertCircle, User } from 'lucide-react';

export default function ReviewsAndTrust({
  reviews,
  trustProfiles,
  disputes,
  reviewStats,
  currentUserId,
  currentUserType: _currentUserType,
  onSubmitReview: _onSubmitReview,
  onEditReview: _onEditReview,
  onVoteReview,
  onRemoveVote: _onRemoveVote,
  onFilterReviews: _onFilterReviews,
  onUploadVerifiedId: _onUploadVerifiedId,
  onUploadInsurance: _onUploadInsurance,
  onUploadCertification: _onUploadCertification,
  onInitiateBackgroundCheck: _onInitiateBackgroundCheck,
  onUpdateTrustProfile: _onUpdateTrustProfile,
  onInitiateDispute: _onInitiateDispute,
  onSendDisputeMessage: _onSendDisputeMessage,
  onEscalateDispute: _onEscalateDispute,
  onResolveDispute: _onResolveDispute,
  onMarkDisputeResolved: _onMarkDisputeResolved,
  onUploadShowProof: _onUploadShowProof,
  onViewPortfolio: _onViewPortfolio,
  onAssignMediator: _onAssignMediator,
  onAddMediatorNotes: _onAddMediatorNotes,
  onApproveVerification: _onApproveVerification,
  onRejectVerification: _onRejectVerification,
}: ReviewsAndTrustProps) {
  const [activeTab, setActiveTab] = useState<'my-reviews' | 'given-reviews' | 'trust-profile' | 'disputes'>('my-reviews');

  // Filter reviews based on current user
  const myReviews = reviews.filter(r => r.revieweeId === currentUserId);
  const givenReviews = reviews.filter(r => r.reviewerId === currentUserId);

  // Get current user's trust profile
  const myTrustProfile = trustProfiles.find(tp => tp.technicianId === currentUserId);

  // Filter disputes for current user
  const myDisputes = disputes.filter(
    d => d.initiatorId === currentUserId || d.respondentId === currentUserId
  );
  const activeDisputes = myDisputes.filter(d => d.status !== 'resolved' && d.status !== 'closed');
  const resolvedDisputes = myDisputes.filter(d => d.status === 'resolved' || d.status === 'closed');

  // Get stats for current user
  const myStats = currentUserId ? reviewStats[currentUserId] : null;

  const tabs = [
    { id: 'my-reviews' as const, label: 'My Reviews', icon: Star, count: myReviews.length },
    { id: 'given-reviews' as const, label: 'Given Reviews', icon: User, count: givenReviews.length },
    { id: 'trust-profile' as const, label: 'Trust Profile', icon: Shield },
    { id: 'disputes' as const, label: 'Disputes', icon: AlertCircle, count: activeDisputes.length },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-[1800px] mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <div className="relative bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 dark:from-amber-600 dark:via-amber-700 dark:to-orange-700 rounded-xl p-6 sm:p-8 text-white shadow-lg overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-24 -translate-x-24"></div>
            </div>

            <div className="relative">
              <h1 className="text-2xl sm:text-3xl font-bold drop-shadow-sm mb-2">
                Reviews & Trust
              </h1>
              <p className="text-amber-50 drop-shadow-sm">
                Manage your reputation, trust signals, and disputes
              </p>
            </div>
          </div>
        </div>

        <div className="border-b border-zinc-200 dark:border-zinc-800 mb-8">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-amber-500 text-amber-800 dark:text-amber-100'
                      : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      activeTab === tab.id
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-100'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          {activeTab === 'my-reviews' && (
            <div className="flex flex-col lg:grid lg:grid-cols-3 gap-12">
              <div className="lg:col-span-1">
                {myStats ? (
                  <ReviewStats stats={myStats} />
                ) : (
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 text-center text-zinc-500 dark:text-zinc-400">
                    No statistics available yet
                  </div>
                )}
              </div>
              <div className="lg:col-span-2 space-y-4">
                {myReviews.length === 0 ? (
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-12 text-center">
                    <Star className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
                    <p className="text-zinc-500 dark:text-zinc-400">
                      You haven't received any reviews yet
                    </p>
                  </div>
                ) : (
                  myReviews.map((review) => (
                    <ReviewCard
                      key={review.id}
                      review={review}
                      canEdit={false}
                      onVoteHelpful={(id) => onVoteReview?.(id, 'helpful')}
                      onVoteNotHelpful={(id) => onVoteReview?.(id, 'not_helpful')}
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'given-reviews' && (
            <div className="space-y-4">
              {givenReviews.length === 0 ? (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-12 text-center">
                  <User className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-500 dark:text-zinc-400">
                    You haven't left any reviews yet
                  </p>
                </div>
              ) : (
                givenReviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    canEdit={true}
                    onEdit={(id) => console.log('Edit review:', id)}
                    onVoteHelpful={(id) => onVoteReview?.(id, 'helpful')}
                    onVoteNotHelpful={(id) => onVoteReview?.(id, 'not_helpful')}
                  />
                ))
              )}
            </div>
          )}

          {activeTab === 'trust-profile' && (
            <div className="max-w-3xl mx-auto">
              {myTrustProfile ? (
                <TrustProfile
                  trustProfile={myTrustProfile}
                  isOwnProfile={true}
                  onUploadId={() => console.log('Upload ID')}
                  onUploadInsurance={() => console.log('Upload Insurance')}
                  onUploadCertification={() => console.log('Upload Certification')}
                  onInitiateBackgroundCheck={() => console.log('Initiate Background Check')}
                />
              ) : (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-12 text-center">
                  <Shield className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-500 dark:text-zinc-400">
                    No trust profile available
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'disputes' && (
            <div className="space-y-6">
              {activeDisputes.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                    Active Disputes
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeDisputes.map((dispute) => (
                      <DisputeCard
                        key={dispute.id}
                        dispute={dispute}
                        onViewDetails={(id) => console.log('View dispute:', id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {resolvedDisputes.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                    Resolved Disputes
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {resolvedDisputes.map((dispute) => (
                      <DisputeCard
                        key={dispute.id}
                        dispute={dispute}
                        onViewDetails={(id) => console.log('View dispute:', id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {myDisputes.length === 0 && (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-12 text-center">
                  <AlertCircle className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-500 dark:text-zinc-400">
                    No disputes to display
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
