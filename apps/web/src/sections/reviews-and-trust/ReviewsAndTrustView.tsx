import { ReviewsAndTrust } from './components';
import type { Review, TrustProfile, Dispute, ReviewStats } from './types';
import dataImport from './data.json';

export default function ReviewsAndTrustView() {
  // Extract data from the JSON file with proper type assertions
  const data = dataImport as {
    reviews: Review[];
    trustProfiles: TrustProfile[];
    disputes: Dispute[];
    reviewStats: Record<string, ReviewStats>;
  };
  const { reviews, trustProfiles, disputes, reviewStats } = data;

  // For demo purposes, simulate a current user (Marcus Rodriguez)
  const currentUserId = 'usr_tech_015';
  const currentUserType = 'technician';

  const handleSubmitReview = (review: any) => {
    console.log('Submit review:', review);
  };

  const handleEditReview = (reviewId: string, updates: any) => {
    console.log('Edit review:', reviewId, updates);
  };

  const handleVoteReview = (reviewId: string, voteType: 'helpful' | 'not_helpful') => {
    console.log('Vote review:', reviewId, voteType);
  };

  const handleRemoveVote = (reviewId: string) => {
    console.log('Remove vote:', reviewId);
  };

  const handleFilterReviews = (filters: any) => {
    console.log('Filter reviews:', filters);
  };

  const handleUploadVerifiedId = (technicianId: string, file: File, documentType: string) => {
    console.log('Upload verified ID:', technicianId, file, documentType);
  };

  const handleUploadInsurance = (technicianId: string, file: File, details: any) => {
    console.log('Upload insurance:', technicianId, file, details);
  };

  const handleUploadCertification = (technicianId: string, file: File, details: any) => {
    console.log('Upload certification:', technicianId, file, details);
  };

  const handleInitiateBackgroundCheck = (technicianId: string) => {
    console.log('Initiate background check:', technicianId);
  };

  const handleUpdateTrustProfile = (technicianId: string, updates: any) => {
    console.log('Update trust profile:', technicianId, updates);
  };

  const handleInitiateDispute = (dispute: any) => {
    console.log('Initiate dispute:', dispute);
  };

  const handleSendDisputeMessage = (disputeId: string, message: string, attachments?: File[]) => {
    console.log('Send dispute message:', disputeId, message, attachments);
  };

  const handleEscalateDispute = (disputeId: string, toStage: any) => {
    console.log('Escalate dispute:', disputeId, toStage);
  };

  const handleResolveDispute = (disputeId: string, resolution: any) => {
    console.log('Resolve dispute:', disputeId, resolution);
  };

  const handleMarkDisputeResolved = (disputeId: string) => {
    console.log('Mark dispute resolved:', disputeId);
  };

  const handleUploadShowProof = (technicianId: string, bookingId: string, files: File[], metadata: any) => {
    console.log('Upload show proof:', technicianId, bookingId, files, metadata);
  };

  const handleViewPortfolio = (technicianId: string) => {
    console.log('View portfolio:', technicianId);
  };

  const handleAssignMediator = (disputeId: string, mediatorId: string) => {
    console.log('Assign mediator:', disputeId, mediatorId);
  };

  const handleAddMediatorNotes = (disputeId: string, notes: string) => {
    console.log('Add mediator notes:', disputeId, notes);
  };

  const handleApproveVerification = (technicianId: string, verificationType: any, itemId?: string) => {
    console.log('Approve verification:', technicianId, verificationType, itemId);
  };

  const handleRejectVerification = (technicianId: string, verificationType: any, reason: string, itemId?: string) => {
    console.log('Reject verification:', technicianId, verificationType, reason, itemId);
  };

  return (
    <ReviewsAndTrust
      reviews={reviews}
      trustProfiles={trustProfiles}
      disputes={disputes}
      reviewStats={reviewStats}
      currentUserId={currentUserId}
      currentUserType={currentUserType}
      onSubmitReview={handleSubmitReview}
      onEditReview={handleEditReview}
      onVoteReview={handleVoteReview}
      onRemoveVote={handleRemoveVote}
      onFilterReviews={handleFilterReviews}
      onUploadVerifiedId={handleUploadVerifiedId}
      onUploadInsurance={handleUploadInsurance}
      onUploadCertification={handleUploadCertification}
      onInitiateBackgroundCheck={handleInitiateBackgroundCheck}
      onUpdateTrustProfile={handleUpdateTrustProfile}
      onInitiateDispute={handleInitiateDispute}
      onSendDisputeMessage={handleSendDisputeMessage}
      onEscalateDispute={handleEscalateDispute}
      onResolveDispute={handleResolveDispute}
      onMarkDisputeResolved={handleMarkDisputeResolved}
      onUploadShowProof={handleUploadShowProof}
      onViewPortfolio={handleViewPortfolio}
      onAssignMediator={handleAssignMediator}
      onAddMediatorNotes={handleAddMediatorNotes}
      onApproveVerification={handleApproveVerification}
      onRejectVerification={handleRejectVerification}
    />
  );
}
