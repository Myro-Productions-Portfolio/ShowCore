import type {
  SystemHealthProps,
  SystemHealth as SystemHealthType,
  PerformanceMetric,
} from '../types';

/**
 * SystemHealth Component
 *
 * Production-grade system health monitoring dashboard for admin portal.
 * Features overall health status, performance metrics, system alerts, and integration monitoring.
 */
export function SystemHealth({
  systemHealth,
  alerts,
  performanceMetrics,
  integrations,
  onRefresh,
  onResolveAlert,
  isLoading = false,
}: SystemHealthProps) {
  // Get status color classes
  const getStatusColor = (status: SystemHealthType['status']) => {
    switch (status) {
      case 'healthy':
        return 'text-emerald-500';
      case 'degraded':
        return 'text-amber-500';
      case 'down':
        return 'text-red-500';
    }
  };

  const getStatusBg = (status: SystemHealthType['status']) => {
    switch (status) {
      case 'healthy':
        return 'bg-emerald-500/10 border-emerald-500/20';
      case 'degraded':
        return 'bg-amber-500/10 border-amber-500/20';
      case 'down':
        return 'bg-red-500/10 border-red-500/20';
    }
  };

  const getMetricStatusColor = (status: PerformanceMetric['status']) => {
    switch (status) {
      case 'good':
        return 'text-emerald-500';
      case 'warning':
        return 'text-amber-500';
      case 'critical':
        return 'text-red-500';
    }
  };

  const getMetricStatusBg = (status: PerformanceMetric['status']) => {
    switch (status) {
      case 'good':
        return 'bg-emerald-500';
      case 'warning':
        return 'bg-amber-500';
      case 'critical':
        return 'bg-red-500';
    }
  };

  const getSeverityColor = (severity: 'info' | 'warning' | 'critical') => {
    switch (severity) {
      case 'info':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'warning':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
      case 'critical':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const daysSinceIncident = systemHealth.lastIncident
    ? Math.floor(
        (new Date().getTime() - new Date(systemHealth.lastIncident).getTime()) /
          86400000
      )
    : systemHealth.uptimeDays;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="max-w-7xl mx-auto px-6 py-6 sm:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                System Health
              </h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                Real-time platform monitoring and performance metrics
              </p>
            </div>
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="px-4 py-2 bg-amber-500 text-zinc-950 rounded-lg font-medium hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 sm:px-8 space-y-8">
        {/* Overall Health Status Hero */}
        <div
          className={`border rounded-xl p-8 ${getStatusBg(systemHealth.status)}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-6">
              {/* Status Indicator */}
              <div className="relative">
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center ${getStatusColor(systemHealth.status)}`}
                >
                  {systemHealth.status === 'healthy' && (
                    <svg
                      className="w-10 h-10"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                  {systemHealth.status === 'degraded' && (
                    <svg
                      className="w-10 h-10"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  )}
                  {systemHealth.status === 'down' && (
                    <svg
                      className="w-10 h-10"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  )}
                </div>
                {systemHealth.status === 'healthy' && (
                  <div className="absolute inset-0 animate-pulse">
                    <div className="w-20 h-20 rounded-full bg-emerald-500/20" />
                  </div>
                )}
              </div>

              {/* Status Details */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2
                    className={`text-3xl font-semibold ${getStatusColor(systemHealth.status)}`}
                  >
                    {systemHealth.status === 'healthy' && 'All Systems Operational'}
                    {systemHealth.status === 'degraded' && 'Degraded Performance'}
                    {systemHealth.status === 'down' && 'System Down'}
                  </h2>
                </div>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm max-w-2xl">
                  {systemHealth.status === 'healthy' &&
                    'All platform services are running normally with optimal performance.'}
                  {systemHealth.status === 'degraded' &&
                    'Some services are experiencing reduced performance. Teams are investigating.'}
                  {systemHealth.status === 'down' &&
                    'Critical systems are offline. Emergency response in progress.'}
                </p>
              </div>
            </div>
          </div>

          {/* Key Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            {/* Uptime */}
            <div className="bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
              <div className="text-zinc-600 dark:text-zinc-400 text-xs font-medium mb-2">
                Uptime
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                  {systemHealth.uptime}
                </span>
              </div>
              {/* Circular progress */}
              <div className="mt-3 relative w-12 h-12">
                <svg className="w-12 h-12 -rotate-90">
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="text-zinc-200 dark:text-zinc-800"
                  />
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={`${parseFloat(systemHealth.uptime) * 1.256} 125.6`}
                    className="text-emerald-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] font-semibold text-zinc-900 dark:text-zinc-50">
                    {systemHealth.uptime}
                  </span>
                </div>
              </div>
            </div>

            {/* Days Since Last Incident */}
            <div className="bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
              <div className="text-zinc-600 dark:text-zinc-400 text-xs font-medium mb-2">
                Days Since Incident
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                  {daysSinceIncident}
                </span>
                <span className="text-sm text-zinc-500 dark:text-zinc-500">days</span>
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-2">
                Last: {systemHealth.lastIncident ? new Date(systemHealth.lastIncident).toLocaleDateString() : 'Never'}
              </div>
            </div>

            {/* Active Users */}
            <div className="bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
              <div className="text-zinc-600 dark:text-zinc-400 text-xs font-medium mb-2">
                Active Users
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                  {systemHealth.activeUsers.toLocaleString()}
                </span>
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-2">
                Current sessions
              </div>
            </div>

            {/* Peak Concurrent */}
            <div className="bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
              <div className="text-zinc-600 dark:text-zinc-400 text-xs font-medium mb-2">
                Peak Concurrent
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                  {systemHealth.peakConcurrentUsers.toLocaleString()}
                </span>
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-2">
                24h high
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics Grid */}
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
            Performance Metrics
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {performanceMetrics.map((metric) => {
              const percentage = Math.min(
                (metric.value / metric.threshold) * 100,
                100
              );
              const isOverThreshold = metric.value > metric.threshold;

              return (
                <div
                  key={metric.name}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        {metric.name}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5">
                        Threshold: {metric.threshold}
                        {metric.unit}
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${getMetricStatusColor(metric.status)}`}
                    >
                      {metric.status === 'good' && (
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                      {metric.status === 'warning' && (
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01"
                          />
                        </svg>
                      )}
                      {metric.status === 'critical' && (
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      )}
                      {metric.status}
                    </span>
                  </div>

                  {/* Value Display */}
                  <div className="mb-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
                        {metric.value.toFixed(metric.unit === 'ms' ? 0 : 1)}
                      </span>
                      <span className="text-sm text-zinc-500 dark:text-zinc-500">
                        {metric.unit}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="relative">
                    <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${getMetricStatusBg(metric.status)}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    {isOverThreshold && (
                      <div className="text-xs text-amber-500 mt-1">
                        Above threshold
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* System Alerts */}
        {alerts.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
              System Alerts ({alerts.filter((a) => !a.resolved).length} Active)
            </h3>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg divide-y divide-zinc-200 dark:divide-zinc-800">
              {alerts.map((alert) => (
                <div key={alert.id} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getSeverityColor(alert.severity)}`}
                        >
                          {alert.severity}
                        </span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-500 uppercase tracking-wide">
                          {alert.component.replace(/_/g, ' ')}
                        </span>
                        {alert.resolved && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            Resolved
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-zinc-800 dark:text-zinc-200 mb-1">
                        {alert.message}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-500">
                        <span>{formatTimestamp(alert.timestamp)}</span>
                        {alert.resolvedAt && (
                          <span>
                            Resolved {formatTimestamp(alert.resolvedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                    {!alert.resolved && (
                      <button
                        onClick={() => onResolveAlert(alert.id)}
                        className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-medium rounded-lg transition-colors"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Integrations Status */}
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
            Integration Health
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.map((integration) => (
              <div
                key={integration.name}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        integration.status === 'healthy'
                          ? 'bg-emerald-500'
                          : integration.status === 'degraded'
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                      }`}
                    >
                      {integration.status === 'healthy' && (
                        <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                      )}
                    </div>
                    <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {integration.name}
                    </div>
                  </div>
                  <span
                    className={`text-xs font-medium ${getStatusColor(integration.status)}`}
                  >
                    {integration.status}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 dark:text-zinc-500">Uptime</span>
                    <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                      {integration.uptime}
                    </span>
                  </div>
                  {integration.responseTime !== undefined && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500 dark:text-zinc-500">Response Time</span>
                      <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                        {integration.responseTime}ms
                      </span>
                    </div>
                  )}
                  {integration.errorCount !== undefined && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500 dark:text-zinc-500">Errors (24h)</span>
                      <span
                        className={`font-medium ${
                          integration.errorCount > 0
                            ? 'text-amber-500'
                            : 'text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        {integration.errorCount}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-zinc-200 dark:border-zinc-800">
                    <span className="text-zinc-500 dark:text-zinc-500">Last Checked</span>
                    <span className="text-zinc-600 dark:text-zinc-400">
                      {formatTimestamp(integration.lastChecked)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
