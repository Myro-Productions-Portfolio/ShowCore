import { ShowProofXP } from '@/sections/show-proof-and-xp/components'
import data from '@/sections/show-proof-and-xp/data.json'
import type { ShowProofUploadData, ShowProof, TechnicianXPProfile, LotteryStatus, TierDefinition } from '@/sections/show-proof-and-xp/types'

export function ShowProofPage() {
  const handleUploadShowProof = async (uploadData: ShowProofUploadData) => {
    console.log('Upload show proof:', uploadData)
    await new Promise((resolve) => setTimeout(resolve, 1500))
  }

  const handleEditShowProof = async (id: string, editData: Partial<ShowProofUploadData>) => {
    console.log('Edit show proof:', id, editData)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const handleDeleteShowProof = async (id: string) => {
    console.log('Delete show proof:', id)
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  const handleVerifyShowProof = async (id: string, verificationData: { starRating: 1 | 2 | 3 | 4 | 5; feedback?: string }) => {
    console.log('Verify show proof:', id, verificationData)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

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
        onViewShowProofDetail={(id) => console.log('View show proof detail:', id)}
        onViewLotteryRules={() => console.log('View lottery rules')}
      />
    </div>
  )
}
