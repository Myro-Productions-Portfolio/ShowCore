import { useState } from 'react';
import type { SkillRatings } from '../types';
import { Star, Send } from 'lucide-react';

interface ReviewFormProps {
  bookingId?: string;
  revieweeName?: string;
  revieweeType?: 'client' | 'technician';
  onSubmit?: (review: {
    bookingId: string;
    rating: number;
    feedback: string;
    skillRatings: SkillRatings;
    isAnonymous: boolean;
  }) => void;
  onCancel?: () => void;
}

export default function ReviewForm({
  bookingId = '',
  revieweeName = '',
  revieweeType = 'technician',
  onSubmit,
  onCancel,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [skillRatings, setSkillRatings] = useState<SkillRatings>({
    punctuality: 5,
    communication: 5,
    technicalSkill: 5,
    professionalism: 5,
  });
  const [isAnonymous, setIsAnonymous] = useState(false);

  const minFeedbackLength = 50;
  const canSubmit = rating > 0 && feedback.length >= minFeedbackLength;

  const handleSubmit = () => {
    if (canSubmit && onSubmit) {
      onSubmit({
        bookingId,
        rating,
        feedback,
        skillRatings,
        isAnonymous,
      });
    }
  };

  const skillLabels = revieweeType === 'technician'
    ? [
        { key: 'punctuality' as const, label: 'Punctuality' },
        { key: 'communication' as const, label: 'Communication' },
        { key: 'technicalSkill' as const, label: 'Technical Skill' },
        { key: 'professionalism' as const, label: 'Professionalism' },
      ]
    : [
        { key: 'communication' as const, label: 'Communication' },
        { key: 'organization' as const, label: 'Organization' },
        { key: 'paymentPromptness' as const, label: 'Payment Promptness' },
        { key: 'professionalism' as const, label: 'Professionalism' },
      ];

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
          Leave a Review
        </h3>
        {revieweeName && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            How was your experience with {revieweeName}?
          </p>
        )}
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
            Overall Rating *
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-10 h-10 transition-colors ${
                    star <= (hoverRating || rating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-zinc-300 dark:text-zinc-700'
                  }`}
                />
              </button>
            ))}
            {(hoverRating || rating) > 0 && (
              <span className="ml-3 text-sm font-medium text-amber-800 dark:text-amber-100">
                {ratingLabels[hoverRating || rating]}
              </span>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Written Feedback * (minimum {minFeedbackLength} characters)
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Share your experience in detail. What went well? What could be improved?"
            rows={6}
            className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
          />
          <div className={`text-xs mt-1 ${feedback.length >= minFeedbackLength ? 'text-green-600 dark:text-green-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
            {feedback.length}/{minFeedbackLength} characters
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
            Skill Ratings
          </label>
          <div className="space-y-4 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
            {skillLabels.map(({ key, label }) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">{label}</span>
                  <span className="text-sm font-semibold text-amber-800 dark:text-amber-100">
                    {skillRatings[key] || 5}/5
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={skillRatings[key] || 5}
                  onChange={(e) =>
                    setSkillRatings({
                      ...skillRatings,
                      [key]: parseInt(e.target.value),
                    })
                  }
                  className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  <span>Poor</span>
                  <span>Excellent</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
          <input
            type="checkbox"
            id="anonymous"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="w-4 h-4 accent-amber-500 cursor-pointer"
          />
          <label htmlFor="anonymous" className="text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer">
            Submit anonymously (your name won't be shown publicly)
          </label>
        </div>

        {revieweeType === 'technician' && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-xs text-amber-800 dark:text-amber-100">
              Submitting this review will award XP to the technician and make your review public on their profile.
              You can edit your review later if needed.
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            Submit Review
          </button>
        </div>
      </div>
    </div>
  );
}
