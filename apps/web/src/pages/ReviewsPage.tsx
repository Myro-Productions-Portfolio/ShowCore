import { useState } from 'react'
import { ReviewsAndTrust } from '@/sections/reviews-and-trust/components'
import type { Review, TrustProfile, Dispute, ReviewStats } from '@/sections/reviews-and-trust/types'
import dataImport from '@/sections/reviews-and-trust/data.json'

export function ReviewsPage() {
  const data = dataImport as {
    reviews: Review[]
    trustProfiles: TrustProfile[]
    disputes: Dispute[]
    reviewStats: Record<string, ReviewStats>
  }
  const { reviews, trustProfiles, disputes, reviewStats } = data

  const currentUserId = 'usr_tech_015'
  const currentUserType = 'technician'

  // State management for reviews page
  const [filterState, setFilterState] = useState({
    rating: 'all',
    dateRange: 'all',
    verified: false,
    disputed: false
  })
  const [voteState, setVoteState] = useState<Record<string, 'up' | 'down' | null>>({})
  const [isLoading, setIsLoading] = useState(false)

  return (
    <ReviewsAndTrust
      reviews={reviews}
      trustProfiles={trustProfiles}
      disputes={disputes}
      reviewStats={reviewStats}
      currentUserId={currentUserId}
      currentUserType={currentUserType}
      onSubmitReview={(review) => console.log('Submit review:', review)}
      onEditReview={(reviewId, updates) => console.log('Edit review:', reviewId, updates)}
      onVoteReview={(reviewId, voteType) => {
        setIsLoading(true)
        // Simulate loading delay for vote operations
        setTimeout(() => {
          // Map the vote types correctly
          const mappedVoteType = voteType === 'helpful' ? 'up' : voteType === 'not_helpful' ? 'down' : voteType
          setVoteState(prev => ({ ...prev, [reviewId]: mappedVoteType }))
          setIsLoading(false)
        }, 200)
      }}
      onRemoveVote={(reviewId) => setVoteState(prev => ({ ...prev, [reviewId]: null }))}
      onFilterReviews={(filters) => {
        setIsLoading(true)
        // Simulate loading delay for filter changes
        setTimeout(() => {
          // Only update compatible filter properties
          const compatibleFilters = {
            rating: typeof filters.rating === 'number' ? filters.rating.toString() : filters.rating || 'all',
            dateRange: 'all',
            verified: false,
            disputed: false
          }
          setFilterState(prev => ({ ...prev, ...compatibleFilters }))
          setIsLoading(false)
        }, 300)
      }}
      onUploadVerifiedId={(technicianId, file, documentType) => console.log('Upload verified ID:', technicianId, file, documentType)}
      onUploadInsurance={(technicianId, file, details) => console.log('Upload insurance:', technicianId, file, details)}
      onUploadCertification={(technicianId, file, details) => console.log('Upload certification:', technicianId, file, details)}
      onInitiateBackgroundCheck={(technicianId) => console.log('Initiate background check:', technicianId)}
      onUpdateTrustProfile={(technicianId, updates) => console.log('Update trust profile:', technicianId, updates)}
      onInitiateDispute={(dispute) => console.log('Initiate dispute:', dispute)}
      onSendDisputeMessage={(disputeId, message, attachments) => console.log('Send dispute message:', disputeId, message, attachments)}
      onEscalateDispute={(disputeId, toStage) => console.log('Escalate dispute:', disputeId, toStage)}
      onResolveDispute={(disputeId, resolution) => console.log('Resolve dispute:', disputeId, resolution)}
      onMarkDisputeResolved={(disputeId) => console.log('Mark dispute resolved:', disputeId)}
      onUploadShowProof={(technicianId, bookingId, files, metadata) => console.log('Upload show proof:', technicianId, bookingId, files, metadata)}
      onViewPortfolio={(technicianId) => console.log('View portfolio:', technicianId)}
      onAssignMediator={(disputeId, mediatorId) => console.log('Assign mediator:', disputeId, mediatorId)}
      onAddMediatorNotes={(disputeId, notes) => console.log('Add mediator notes:', disputeId, notes)}
      onApproveVerification={(technicianId, verificationType, itemId) => console.log('Approve verification:', technicianId, verificationType, itemId)}
      onRejectVerification={(technicianId, verificationType, reason, itemId) => console.log('Reject verification:', technicianId, verificationType, reason, itemId)}
    />
  )
}
