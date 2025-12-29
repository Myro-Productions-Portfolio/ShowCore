import type { Review } from '../types';
import { Star, ThumbsUp, ThumbsDown, Edit2, Award } from 'lucide-react';

// Company logo imports
import AudioVivignLogo from '@/assets/companies/AudioVivign.PNG';
import BroadcastMediaGroupLogo from '@/assets/companies/BroadcastMediaGroup.PNG';
import LiveTechSolutionsLogo from '@/assets/companies/LiveTechSolutions.PNG';
import SondWaveLogo from '@/assets/companies/SondWave.PNG';
import StageLightLogo from '@/assets/companies/StageLight.PNG';

// Map company name patterns to their logos
const companyLogoMap: Record<string, string> = {
  'audiovivign': AudioVivignLogo,
  'audio vivign': AudioVivignLogo,
  'broadcastmediagroup': BroadcastMediaGroupLogo,
  'broadcast media': BroadcastMediaGroupLogo,
  'livetechsolutions': LiveTechSolutionsLogo,
  'live tech': LiveTechSolutionsLogo,
  'sondwave': SondWaveLogo,
  'sond wave': SondWaveLogo,
  'stagelight': StageLightLogo,
  'stage light': StageLightLogo,
};

// Helper function to get company logo by name
function getCompanyLogo(companyName: string | null | undefined): string | undefined {
  if (!companyName) return undefined;
  const normalizedName = companyName.toLowerCase().trim();

  // Check for exact match first
  if (companyLogoMap[normalizedName]) {
    return companyLogoMap[normalizedName];
  }

  // Check if any key is contained in the company name
  for (const [key, logo] of Object.entries(companyLogoMap)) {
    if (normalizedName.includes(key)) {
      return logo;
    }
  }

  return undefined;
}

interface ReviewCardProps {
  review: Review;
  canEdit?: boolean;
  currentUserVote?: 'helpful' | 'not_helpful' | null;
  onEdit?: (reviewId: string) => void;
  onVoteHelpful?: (reviewId: string) => void;
  onVoteNotHelpful?: (reviewId: string) => void;
}

export default function ReviewCard({
  review,
  canEdit = false,
  currentUserVote = null,
  onEdit,
  onVoteHelpful,
  onVoteNotHelpful,
}: ReviewCardProps) {
  const stars = Array.from({ length: 5 }, (_, i) => i + 1);
  const netVotes = review.helpfulVotes - review.notHelpfulVotes;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const skillRatingsArray = [
    { label: 'Punctuality', value: review.skillRatings.punctuality },
    { label: 'Communication', value: review.skillRatings.communication },
    { label: 'Technical', value: review.skillRatings.technicalSkill },
    { label: 'Professionalism', value: review.skillRatings.professionalism },
  ];

  if (review.skillRatings.organization) {
    skillRatingsArray.push({ label: 'Organization', value: review.skillRatings.organization });
  }
  if (review.skillRatings.paymentPromptness) {
    skillRatingsArray.push({ label: 'Payment', value: review.skillRatings.paymentPromptness });
  }

  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 bg-white dark:bg-zinc-900 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          {(() => {
            const companyLogo = getCompanyLogo(review.reviewerCompany);
            if (companyLogo) {
              return (
                <img
                  src={companyLogo}
                  alt={`${review.reviewerCompany} logo`}
                  className="w-12 h-12 rounded-full object-cover"
                />
              );
            }
            return (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-semibold text-lg">
                {review.reviewerName.charAt(0)}
              </div>
            );
          })()}
          <div>
            <div className="font-semibold text-zinc-900 dark:text-zinc-100">
              {review.reviewerName}
            </div>
            {review.reviewerCompany && (
              <div className="text-sm text-zinc-500 dark:text-zinc-400">
                {review.reviewerCompany}
              </div>
            )}
          </div>
        </div>
        {canEdit && onEdit && (
          <button
            onClick={() => onEdit(review.id)}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            title="Edit review"
          >
            <Edit2 className="w-4 h-4 text-zinc-500" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1">
          {stars.map((star) => (
            <Star
              key={star}
              fill={star <= review.rating ? 'currentColor' : 'none'}
              className={`w-5 h-5 ${
                star <= review.rating
                  ? 'text-amber-400'
                  : 'text-zinc-300 dark:text-zinc-700'
              }`}
            />
          ))}
        </div>
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          {formatDate(review.createdAt)}
          {review.isEdited && review.editedAt && (
            <span className="ml-2 text-zinc-400 dark:text-zinc-500">
              (Edited {formatDate(review.editedAt)})
            </span>
          )}
        </div>
        {review.xpAwarded && (
          <div className="flex items-center gap-1 ml-auto bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-100 px-2 py-1 rounded-full text-xs font-medium">
            <Award className="w-3 h-3" />
            <span>{review.xpAwarded} XP</span>
          </div>
        )}
      </div>

      <p className="text-zinc-700 dark:text-zinc-300 mb-4 leading-relaxed">
        {review.feedback}
      </p>

      <div className="mb-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
        <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
          Skill Ratings
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {skillRatingsArray.map((skill) => (
            <div key={skill.label} className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-xs text-zinc-600 dark:text-zinc-400 truncate">
                  {skill.label}
                </div>
                <div className="flex gap-0.5 mt-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 w-full rounded-full ${
                        i < skill.value
                          ? 'bg-amber-400'
                          : 'bg-zinc-200 dark:bg-zinc-700'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          Was this helpful?
        </div>
        <button
          onClick={() => onVoteHelpful?.(review.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
            currentUserVote === 'helpful'
              ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300'
              : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
          }`}
        >
          <ThumbsUp className="w-4 h-4" />
          <span className="text-sm font-medium">{review.helpfulVotes}</span>
        </button>
        <button
          onClick={() => onVoteNotHelpful?.(review.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
            currentUserVote === 'not_helpful'
              ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
              : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
          }`}
        >
          <ThumbsDown className="w-4 h-4" />
          <span className="text-sm font-medium">{review.notHelpfulVotes}</span>
        </button>
        {netVotes !== 0 && (
          <div className="ml-auto text-sm text-zinc-500 dark:text-zinc-400">
            Net: <span className={netVotes > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
              {netVotes > 0 ? '+' : ''}{netVotes}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
