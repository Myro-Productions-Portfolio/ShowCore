import type { DashboardProps, DashboardAlert, RecentActivity } from '../types';

/**
 * AdminDashboard Component
 *
 * Dark theme admin dashboard with data-dense layout featuring:
 * - Metric cards grid with key platform statistics
 * - Alerts section with severity-based color coding
 * - Recent activity feed timeline
 *
 * Design tokens: amber/yellow primary, zinc neutral, dark background
 */
export function AdminDashboard({
  metrics,
  alerts,
  recentActivity,
  onDismissAlert,
  onViewAlert,
}: DashboardProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <div className="max-w-[1600px] mx-auto p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="border-b border-zinc-200 dark:border-zinc-800 pb-6">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Dashboard</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">Platform overview and critical alerts</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <MetricCard
            title="Total Users"
            value={metrics.totalUsers.toLocaleString()}
            subtitle={`${metrics.totalTechnicians} technicians • ${metrics.totalCompanies} companies`}
            trend={metrics.userGrowth.newUsersThisMonth > 0 ? 'up' : 'neutral'}
            trendLabel={`+${metrics.userGrowth.newUsersToday} today`}
          />

          <MetricCard
            title="Active Bookings"
            value={metrics.activeBookings.toLocaleString()}
            subtitle={`${metrics.completedBookingsThisMonth} completed this month`}
          />

          <MetricCard
            title="Revenue This Month"
            value={`$${(metrics.revenue.thisMonth / 1000).toFixed(1)}k`}
            subtitle={`Last month: $${(metrics.revenue.lastMonth / 1000).toFixed(1)}k`}
            trend={metrics.revenue.percentChange >= 0 ? 'up' : 'down'}
            trendLabel={`${metrics.revenue.percentChange >= 0 ? '+' : ''}${metrics.revenue.percentChange.toFixed(1)}%`}
          />

          <MetricCard
            title="Open Disputes"
            value={metrics.disputes.open.toLocaleString()}
            subtitle={`${metrics.disputes.resolved} resolved`}
            alert={metrics.disputes.open > 10}
          />

          <MetricCard
            title="Pending Moderation"
            value={metrics.flaggedContent.pending.toLocaleString()}
            subtitle={`${metrics.flaggedContent.resolvedToday} resolved today`}
            alert={metrics.flaggedContent.pending > 5}
          />

          <MetricCard
            title="User Growth"
            value={`+${metrics.userGrowth.newUsersThisWeek}`}
            subtitle="This week"
            trend="up"
            trendLabel={`${metrics.userGrowth.newUsersThisMonth} this month`}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Alerts Section - Takes 2 columns on XL screens */}
          <div className="xl:col-span-2">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
              <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Critical Alerts</h2>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">
                      {alerts.length} {alerts.length === 1 ? 'alert' : 'alerts'} requiring attention
                    </p>
                  </div>
                  {alerts.length > 0 && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                      Action Required
                    </span>
                  )}
                </div>
              </div>

              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {alerts.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 mb-3">
                      <svg className="w-6 h-6 text-zinc-500 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-zinc-600 dark:text-zinc-400">No alerts at this time</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-1">The platform is running smoothly</p>
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <AlertItem
                      key={alert.id}
                      alert={alert}
                      onDismiss={() => onDismissAlert(alert.id)}
                      onView={() => onViewAlert(alert)}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Recent Activity - Takes 1 column on XL screens */}
          <div className="xl:col-span-1">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
              <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Recent Activity</h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">Latest platform events</p>
              </div>

              <div className="px-6 py-4">
                {recentActivity.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-zinc-600 dark:text-zinc-400">No recent activity</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <ActivityItem
                        key={activity.id}
                        activity={activity}
                        isLast={index === recentActivity.length - 1}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  alert?: boolean;
}

function MetricCard({ title, value, subtitle, trend, trendLabel, alert }: MetricCardProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{title}</h3>
        {alert && (
          <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        )}
      </div>

      <div className="space-y-1">
        <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{value}</p>

        {trend && trendLabel && (
          <div className="flex items-center gap-1.5">
            {trend === 'up' && (
              <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            )}
            {trend === 'down' && (
              <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            )}
            <span className={`text-sm font-medium ${
              trend === 'up' ? 'text-amber-500' :
              trend === 'down' ? 'text-red-500' :
              'text-zinc-400'
            }`}>
              {trendLabel}
            </span>
          </div>
        )}

        {subtitle && (
          <p className="text-xs text-zinc-500 dark:text-zinc-500 leading-tight">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

interface AlertItemProps {
  alert: DashboardAlert;
  onDismiss: () => void;
  onView: () => void;
}

function AlertItem({ alert, onDismiss, onView }: AlertItemProps) {
  const severityStyles = {
    critical: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      text: 'text-red-400',
      icon: 'text-red-500',
    },
    warning: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      text: 'text-amber-400',
      icon: 'text-amber-500',
    },
    info: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      text: 'text-blue-400',
      icon: 'text-blue-500',
    },
  };

  const style = severityStyles[alert.severity];
  const typeLabels = {
    dispute: 'Dispute',
    payment_issue: 'Payment',
    flagged_content: 'Content',
    system_error: 'System',
    security: 'Security',
    user_report: 'Report',
  };

  return (
    <div className="px-6 py-4 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 transition-colors">
      <div className="flex items-start gap-4">
        {/* Alert Icon */}
        <div className={`mt-0.5 flex-shrink-0 w-10 h-10 rounded-lg ${style.bg} border ${style.border} flex items-center justify-center`}>
          {alert.severity === 'critical' && (
            <svg className={`w-5 h-5 ${style.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
          {alert.severity === 'warning' && (
            <svg className={`w-5 h-5 ${style.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {alert.severity === 'info' && (
            <svg className={`w-5 h-5 ${style.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>

        {/* Alert Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-1">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${style.bg} ${style.text} border ${style.border}`}>
                {typeLabels[alert.type]}
              </span>
              <span className={`text-xs font-medium uppercase tracking-wide ${style.text}`}>
                {alert.severity}
              </span>
            </div>
            <time className="text-xs text-zinc-500 dark:text-zinc-500 flex-shrink-0">
              {formatTimestamp(alert.timestamp)}
            </time>
          </div>

          <p className="text-sm text-zinc-800 dark:text-zinc-200 mb-3 leading-relaxed">
            {alert.message}
          </p>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onView}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-300 dark:border-zinc-700 rounded-md transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Details
            </button>

            {!alert.actionRequired && (
              <button
                onClick={onDismiss}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-md transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ActivityItemProps {
  activity: RecentActivity;
  isLast: boolean;
}

function ActivityItem({ activity, isLast }: ActivityItemProps) {
  const activityConfig = {
    user_registered: {
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    booking_completed: {
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-green-400',
      bg: 'bg-green-500/10',
    },
    dispute_opened: {
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
    content_flagged: {
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
        </svg>
      ),
      color: 'text-red-400',
      bg: 'bg-red-500/10',
    },
    user_suspended: {
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      ),
      color: 'text-red-400',
      bg: 'bg-red-500/10',
    },
    credential_verified: {
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
    refund_processed: {
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      ),
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
    },
  };

  const config = activityConfig[activity.type] || {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'text-zinc-400',
    bg: 'bg-zinc-500/10',
  };

  return (
    <div className="flex gap-3 relative">
      {/* Timeline Line */}
      {!isLast && (
        <div className="absolute left-4 top-8 bottom-0 w-px bg-zinc-200 dark:bg-zinc-800" />
      )}

      {/* Icon */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full ${config.bg} flex items-center justify-center ${config.color} relative z-10`}>
        {config.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-4">
        <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed mb-1">
          {activity.description}
        </p>

        <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-500">
          {activity.user && (
            <span className="font-medium text-zinc-600 dark:text-zinc-400">{activity.user}</span>
          )}
          <time>{formatTimestamp(activity.timestamp)}</time>
        </div>
      </div>
    </div>
  );
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
