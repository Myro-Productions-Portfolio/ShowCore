import React from 'react';
import type { LotteryDashboardProps } from '../types';

const LotteryPanel: React.FC<LotteryDashboardProps> = ({ lotteryStatus, onViewRules }) => {
  const getTimeUntilDraw = () => {
    const now = new Date();
    const drawDate = new Date(lotteryStatus.nextDrawDate);
    const diffMs = drawDate.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diffDays > 0) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''}, ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    }
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const ticketTypeIcons = {
    show_completion: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    five_star_review: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
      </svg>
    ),
    referral: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    mentorship: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  };

  return (
    <div className="space-y-6">
      {/* Lottery Header */}
      <div className="bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-500 rounded-xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold mb-1 flex items-center gap-2">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4 4h16v4H4V4zm0 6h16v10H4V10zm4 2v6h8v-6H8z" />
                </svg>
                Lottery System
              </h3>
              <p className="text-white/90 text-sm">
                Earn tickets for visibility boosts and featured placement
              </p>
            </div>
            <button
              onClick={onViewRules}
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-sm font-medium transition-colors"
            >
              Rules
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="text-4xl font-bold mb-1">{lotteryStatus.currentTickets}</div>
              <div className="text-white/90 text-sm">Current Tickets</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="text-lg font-bold mb-1">{getTimeUntilDraw()}</div>
              <div className="text-white/90 text-sm">Until Next Draw</div>
            </div>
          </div>

          <div className="mt-4 text-xs text-white/80">
            Next draw: {formatDate(lotteryStatus.nextDrawDate)}
          </div>
        </div>
      </div>

      {/* Active Boost */}
      {lotteryStatus.activeBoost && (
        <div className="bg-green-500/10 border-2 border-green-500/30 dark:border-green-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-green-700 dark:text-green-400 mb-1 flex items-center gap-2">
                Visibility Boost Active!
                {lotteryStatus.featuredNewcomer && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full">
                    Featured Newcomer
                  </span>
                )}
              </h4>
              <p className="text-sm text-green-600 dark:text-green-300 mb-2">
                Your profile is being featured to top clients and appearing in priority search results.
              </p>
              <div className="flex items-center gap-4 text-xs text-green-600 dark:text-green-400">
                <span>Won: {formatDate(lotteryStatus.activeBoost.wonDate)}</span>
                <span>•</span>
                <span>Expires: {formatDate(lotteryStatus.activeBoost.expiresDate)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lifetime Stats */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">
          Lifetime Stats
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {lotteryStatus.lifetimeTicketsEarned}
            </div>
            <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">Tickets Earned</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {lotteryStatus.lifetimeDrawsEntered}
            </div>
            <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">Draws Entered</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-800 dark:text-amber-100">
              {lotteryStatus.lifetimeWins}
            </div>
            <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">Wins</div>
          </div>
        </div>
      </div>

      {/* Ticket Earning Opportunities */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">
          How to Earn Tickets
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500/10 dark:bg-blue-500/20 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
                {ticketTypeIcons.show_completion}
              </div>
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Complete a show
              </span>
            </div>
            <span className="text-lg font-bold text-amber-800 dark:text-amber-100">1 ticket</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-500/10 dark:bg-amber-500/20 rounded-full flex items-center justify-center text-amber-800 dark:text-amber-100">
                {ticketTypeIcons.five_star_review}
              </div>
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Receive 5-star review
              </span>
            </div>
            <span className="text-lg font-bold text-amber-800 dark:text-amber-100">2 tickets</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-500/10 dark:bg-purple-500/20 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400">
                {ticketTypeIcons.mentorship}
              </div>
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Complete mentorship
              </span>
            </div>
            <span className="text-lg font-bold text-amber-800 dark:text-amber-100">2 tickets</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500/10 dark:bg-green-500/20 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">
                {ticketTypeIcons.referral}
              </div>
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Refer a technician
              </span>
            </div>
            <span className="text-lg font-bold text-amber-800 dark:text-amber-100">3 tickets</span>
          </div>
        </div>
      </div>

      {/* Ticket History */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">
          Recent Ticket Activity
        </h3>
        <div className="space-y-3">
          {lotteryStatus.ticketHistory.slice(0, 10).map((entry, index) => (
            <div
              key={index}
              className="flex items-start gap-3 pb-3 last:pb-0 last:border-0 border-b border-zinc-200 dark:border-zinc-800"
            >
              <div className="flex-shrink-0 w-8 h-8 bg-amber-500/10 dark:bg-amber-500/20 rounded-full flex items-center justify-center text-amber-800 dark:text-amber-100">
                {ticketTypeIcons[entry.type]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-900 dark:text-zinc-100 font-medium">
                  {entry.reason}
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                  {new Date(entry.date).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="text-sm font-bold text-amber-800 dark:text-amber-100">
                  +{entry.earned} {entry.earned === 1 ? 'ticket' : 'tickets'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LotteryPanel;
