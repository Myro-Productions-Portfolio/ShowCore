import React from 'react';
import type { XPDashboardProps } from '../types';

const XPDashboard: React.FC<XPDashboardProps> = ({ profile, tierDefinitions }) => {
  const tierColors = {
    Beginner: 'from-zinc-500 to-zinc-600',
    Experienced: 'from-blue-500 to-blue-600',
    Advanced: 'from-purple-500 to-purple-600',
    Pro: 'from-amber-500 to-amber-600',
  };

  const tierBadgeColors = {
    Beginner: 'bg-zinc-500 text-white',
    Experienced: 'bg-blue-500 text-white',
    Advanced: 'bg-purple-500 text-white',
    Pro: 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white',
  };

  const currentTierDef = tierDefinitions.find((t) => t.tier === profile.currentTier);
  const nextTierDef = tierDefinitions.find((t) => t.minXp > profile.totalXp);

  const progressPercentage = currentTierDef && nextTierDef
    ? ((profile.totalXp - currentTierDef.minXp) / (nextTierDef.minXp - currentTierDef.minXp)) * 100
    : 100;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Current Tier & Progress */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`inline-flex items-center gap-2 px-4 py-2 ${tierBadgeColors[profile.currentTier]} text-lg font-bold rounded-lg shadow-lg`}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
                {profile.currentTier}
              </span>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {currentTierDef?.benefits[0]}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              {profile.totalXp.toLocaleString()}
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">Total XP</div>
          </div>
        </div>

        {/* Progress Bar */}
        {profile.xpToNextTier !== null && nextTierDef && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">
                Progress to {nextTierDef.tier}
              </span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {profile.xpToNextTier.toLocaleString()} XP needed
              </span>
            </div>
            <div className="relative h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 bg-gradient-to-r ${tierColors[nextTierDef.tier]} rounded-full transition-all duration-500`}
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-500">
              <span>{currentTierDef?.minXp.toLocaleString()} XP</span>
              <span>{nextTierDef.minXp.toLocaleString()} XP</span>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
          <div className="text-center">
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {profile.totalShows}
            </div>
            <div className="text-xs text-zinc-600 dark:text-zinc-400">Total Shows</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {profile.verifiedShows}
            </div>
            <div className="text-xs text-zinc-600 dark:text-zinc-400">Verified</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-800 dark:text-amber-100 flex items-center justify-center gap-1">
              {profile.averageRating.toFixed(1)}
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            </div>
            <div className="text-xs text-zinc-600 dark:text-zinc-400">Avg Rating</div>
          </div>
        </div>
      </div>

      {/* XP Breakdown */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">
          XP Breakdown
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Verified Shows
            </div>
            <div className="font-semibold text-zinc-900 dark:text-zinc-100">
              {profile.xpBreakdown.verifiedShows.toLocaleString()} XP
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              High Ratings (4-5★)
            </div>
            <div className="font-semibold text-zinc-900 dark:text-zinc-100">
              {profile.xpBreakdown.highRatings.toLocaleString()} XP
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              Complex Shows
            </div>
            <div className="font-semibold text-zinc-900 dark:text-zinc-100">
              {profile.xpBreakdown.complexity.toLocaleString()} XP
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              New Clients
            </div>
            <div className="font-semibold text-zinc-900 dark:text-zinc-100">
              {profile.xpBreakdown.newClients.toLocaleString()} XP
            </div>
          </div>
          {profile.xpBreakdown.milestones > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                Milestones
              </div>
              <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                {profile.xpBreakdown.milestones.toLocaleString()} XP
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">
          Recent Activity
        </h3>
        <div className="space-y-4">
          {profile.recentActivity.map((activity, index) => (
            <div
              key={index}
              className="flex items-start gap-4 pb-4 last:pb-0 last:border-0 border-b border-zinc-200 dark:border-zinc-800"
            >
              <div className="flex-shrink-0 w-10 h-10 bg-amber-500/10 dark:bg-amber-500/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-800 dark:text-amber-100" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-900 dark:text-zinc-100 font-medium">
                  {activity.description}
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                  {formatDate(activity.date)}
                </p>
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="text-sm font-bold text-amber-800 dark:text-amber-100">
                  +{activity.xpEarned} XP
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tier System Reference */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">
          Tier System
        </h3>
        <div className="space-y-4">
          {tierDefinitions.map((tier, index) => {
            const isCurrentTier = tier.tier === profile.currentTier;
            const isPastTier = tier.minXp < profile.totalXp && tier.tier !== profile.currentTier;

            return (
              <div
                key={index}
                className={`relative p-5 rounded-lg border-2 transition-all ${
                  isCurrentTier
                    ? 'border-amber-500 bg-amber-500/5 dark:bg-amber-500/10'
                    : isPastTier
                    ? 'border-green-500/30 bg-green-500/5 dark:bg-green-500/10'
                    : 'border-zinc-200 dark:border-zinc-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-bold text-base ${tierBadgeColors[tier.tier]} inline-block px-3 py-1.5 rounded mb-2`}>
                      {tier.tier}
                    </h4>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {tier.minXp.toLocaleString()} - {tier.maxXp ? tier.maxXp.toLocaleString() : '∞'} XP
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    {isCurrentTier && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500 text-white text-xs font-bold rounded-full">
                        Current
                      </span>
                    )}
                    {isPastTier && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Achieved
                      </span>
                    )}
                  </div>
                </div>

                <ul className="space-y-1.5">
                  {tier.benefits.slice(0, 3).map((benefit, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {benefit}
                    </li>
                  ))}
                  {tier.benefits.length > 3 && (
                    <li className="text-xs text-zinc-500 dark:text-zinc-500 ml-6">
                      +{tier.benefits.length - 3} more benefits
                    </li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default XPDashboard;
