import type { ReviewStats as ReviewStatsType } from '../types';
import { Star, TrendingUp } from 'lucide-react';

interface ReviewStatsProps {
  stats: ReviewStatsType;
}

export default function ReviewStats({ stats }: ReviewStatsProps) {
  const ratingBreakdownArray = [
    { stars: 5, count: stats.ratingBreakdown[5] },
    { stars: 4, count: stats.ratingBreakdown[4] },
    { stars: 3, count: stats.ratingBreakdown[3] },
    { stars: 2, count: stats.ratingBreakdown[2] },
    { stars: 1, count: stats.ratingBreakdown[1] },
  ];

  const maxCount = Math.max(...ratingBreakdownArray.map(r => r.count), 1);

  const skillAveragesArray = [
    { label: 'Punctuality', value: stats.skillAverages.punctuality },
    { label: 'Communication', value: stats.skillAverages.communication },
    { label: 'Technical Skill', value: stats.skillAverages.technicalSkill },
    { label: 'Professionalism', value: stats.skillAverages.professionalism },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 p-6 rounded-xl border border-amber-200 dark:border-amber-800">
        <div className="text-base font-medium text-amber-800 dark:text-amber-100 mb-2">
          Average Rating
        </div>
        <div className="flex items-end gap-3">
          <div className="text-4xl font-bold text-amber-900 dark:text-amber-100">
            {stats.averageRating.toFixed(1)}
          </div>
          <div className="flex items-center gap-0.5 mb-2">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className={`w-5 h-5 ${
                  i < Math.round(stats.averageRating)
                    ? 'fill-amber-500 text-amber-500'
                    : 'text-amber-300 dark:text-amber-700'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-zinc-50 dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="text-base font-medium text-zinc-600 dark:text-zinc-400 mb-2">
            Total Reviews
          </div>
          <div className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">
            {stats.totalReviews}
          </div>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="text-base font-medium text-zinc-600 dark:text-zinc-400 mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Helpful Votes
          </div>
          <div className="text-4xl font-bold text-green-600 dark:text-green-400">
            +{stats.totalHelpfulVotes}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          Rating Distribution
        </div>
        <div className="space-y-3">
          {ratingBreakdownArray.map((item) => (
            <div key={item.stars} className="flex items-center gap-3">
              <div className="flex items-center gap-1 w-16 text-base text-zinc-600 dark:text-zinc-400">
                <span>{item.stars}</span>
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              </div>
              <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${(item.count / maxCount) * 100}%` }}
                />
              </div>
              <div className="w-12 text-base text-right text-zinc-600 dark:text-zinc-400">
                {item.count}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          Skill Averages
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-4">
          {skillAveragesArray.map((skill) => (
            <div key={skill.label} className="space-y-1.5">
              <div className="text-sm text-zinc-600 dark:text-zinc-400 truncate">
                {skill.label}
              </div>
              <div className="flex gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <div
                    key={i}
                    className={`h-2 w-4 rounded-full ${
                      i < Math.round(skill.value)
                        ? 'bg-amber-400'
                        : 'bg-zinc-200 dark:bg-zinc-700'
                    }`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-zinc-50 dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
          Portfolio Status
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {stats.portfolioItemsWithXP}
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              Shows with XP
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-zinc-500 dark:text-zinc-400">
              {stats.portfolioItemsWithoutXP}
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              Portfolio Only
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
