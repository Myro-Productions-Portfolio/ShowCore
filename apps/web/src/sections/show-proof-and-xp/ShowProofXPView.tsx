import React from 'react';
import { ShowProofXP } from './components';
import data from './data.json';
import type { ShowProofUploadData, ShowProof, TechnicianXPProfile, LotteryStatus, TierDefinition } from './types';

const ShowProofXPView: React.FC = () => {
  const handleUploadShowProof = async (uploadData: ShowProofUploadData) => {
    console.log('Upload show proof:', uploadData);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    console.log('Show proof uploaded successfully');
  };

  const handleEditShowProof = async (id: string, editData: Partial<ShowProofUploadData>) => {
    console.log('Edit show proof:', id, editData);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log('Show proof updated successfully');
  };

  const handleDeleteShowProof = async (id: string) => {
    console.log('Delete show proof:', id);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log('Show proof deleted successfully');
  };

  const handleVerifyShowProof = async (
    id: string,
    verificationData: { starRating: 1 | 2 | 3 | 4 | 5; feedback?: string }
  ) => {
    console.log('Verify show proof:', id, verificationData);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log('Show proof verified successfully');
  };

  const handleViewShowProofDetail = (id: string) => {
    console.log('View show proof detail:', id);
  };

  const handleViewLotteryRules = () => {
    console.log('View lottery rules');
    alert(
      'Lottery System Rules:\n\n' +
      '• Earn tickets through various activities\n' +
      '• Weekly draws every Sunday at 8 PM\n' +
      '• Winners receive 7-day visibility boost\n' +
      '• Featured Newcomer badge for winners\n' +
      '• Priority placement in search results\n\n' +
      'How to earn tickets:\n' +
      '• Complete a show: 1 ticket\n' +
      '• Receive 5-star review: 2 tickets\n' +
      '• Complete mentorship: 2 tickets\n' +
      '• Refer a technician: 3 tickets'
    );
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <ShowProofXP
        showProofs={data.showProofs as ShowProof[]}
        technicianProfile={data.technicianProfile as TechnicianXPProfile}
        lotteryStatus={data.lotteryStatus as LotteryStatus}
        tierDefinitions={data.tierDefinitions as TierDefinition[]}
        onUploadShowProof={handleUploadShowProof}
        onEditShowProof={handleEditShowProof}
        onDeleteShowProof={handleDeleteShowProof}
        onVerifyShowProof={handleVerifyShowProof}
        onViewShowProofDetail={handleViewShowProofDetail}
        onViewLotteryRules={handleViewLotteryRules}
      />
    </div>
  );
};

export default ShowProofXPView;
