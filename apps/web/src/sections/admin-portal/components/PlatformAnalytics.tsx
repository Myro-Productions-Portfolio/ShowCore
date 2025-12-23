import type { AnalyticsProps, TimeSeriesData } from '../types';

/**
 * PlatformAnalytics Component
 *
 * Production-grade analytics dashboard for the admin portal with:
 * - Date range selection with quick presets
 * - User growth trends visualization
 * - Booking trends and revenue charts
 * - Category performance tables
 * - Geographical distribution
 * - Engagement metrics cards
 * - Export functionality for each section
 */

export default function PlatformAnalytics({
  analytics,
  dateRange,
  onChangeDateRange,
  onExportData
}: AnalyticsProps) {
  // Date range preset handlers
  const setPreset = (days: number) => {
    const end = new Date().toISOString().split('T')[0];
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    onChangeDateRange({ start, end });
  };

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Platform Analytics</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              {new Date(dateRange.start).toLocaleDateString()} - {new Date(dateRange.end).toLocaleDateString()}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setPreset(7)}
              className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
            >
              Last 7 days
            </button>
            <button
              onClick={() => setPreset(30)}
              className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
            >
              Last 30 days
            </button>
            <button
              onClick={() => setPreset(90)}
              className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
            >
              Last 90 days
            </button>
            <div className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => onChangeDateRange({ ...dateRange, start: e.target.value })}
                className="bg-transparent text-zinc-700 dark:text-zinc-300 text-sm outline-none"
              />
              <span className="text-zinc-500 dark:text-zinc-500">to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => onChangeDateRange({ ...dateRange, end: e.target.value })}
                className="bg-transparent text-zinc-700 dark:text-zinc-300 text-sm outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* User Growth Section */}
      <Section
        title="User Growth"
        onExport={() => onExportData('user-growth')}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-zinc-600 dark:text-zinc-400">Technicians</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-zinc-600 dark:text-zinc-400">Companies</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-zinc-500" />
              <span className="text-zinc-600 dark:text-zinc-400">Total</span>
            </div>
          </div>

          <LineChart
            data={[
              { label: 'Technicians', data: analytics.userGrowth.technicians, color: 'rgb(245, 158, 11)' },
              { label: 'Companies', data: analytics.userGrowth.companies, color: 'rgb(234, 179, 8)' },
              { label: 'Total', data: analytics.userGrowth.total, color: 'rgb(113, 113, 122)' }
            ]}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <MetricCard
              label="Total Technicians"
              value={analytics.userGrowth.technicians[analytics.userGrowth.technicians.length - 1]?.value || 0}
            />
            <MetricCard
              label="Total Companies"
              value={analytics.userGrowth.companies[analytics.userGrowth.companies.length - 1]?.value || 0}
            />
            <MetricCard
              label="Total Users"
              value={analytics.userGrowth.total[analytics.userGrowth.total.length - 1]?.value || 0}
            />
          </div>
        </div>
      </Section>

      {/* Booking Trends Section */}
      <Section
        title="Booking Trends"
        onExport={() => onExportData('booking-trends')}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-zinc-600 dark:text-zinc-400">Total Bookings</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-zinc-600 dark:text-zinc-400">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-zinc-600" />
              <span className="text-zinc-600 dark:text-zinc-400">Cancelled</span>
            </div>
          </div>

          <BarChart
            data={[
              { label: 'Total', data: analytics.bookingTrends.totalBookings, color: 'rgb(245, 158, 11)' },
              { label: 'Completed', data: analytics.bookingTrends.completedBookings, color: 'rgb(234, 179, 8)' },
              { label: 'Cancelled', data: analytics.bookingTrends.cancelledBookings, color: 'rgb(82, 82, 91)' }
            ]}
          />

          <div className="pt-4">
            <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-4">Average Booking Value</h4>
            <LineChart
              data={[
                { label: 'Avg Value', data: analytics.bookingTrends.averageBookingValue, color: 'rgb(245, 158, 11)' }
              ]}
              formatValue={(v) => `$${v.toFixed(0)}`}
            />
          </div>
        </div>
      </Section>

      {/* Revenue Section */}
      <Section
        title="Revenue & Financials"
        onExport={() => onExportData('revenue')}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <RevenueCard
              label="Gross Merchandise Value"
              value={calculateTotal(analytics.revenueData.gmv)}
              trend={calculateTrend(analytics.revenueData.gmv)}
            />
            <RevenueCard
              label="Platform Fees Collected"
              value={calculateTotal(analytics.revenueData.platformFees)}
              trend={calculateTrend(analytics.revenueData.platformFees)}
            />
            <RevenueCard
              label="Payout Volume"
              value={calculateTotal(analytics.revenueData.payoutVolume)}
              trend={calculateTrend(analytics.revenueData.payoutVolume)}
            />
          </div>

          <div>
            <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-4">Revenue Trends</h4>
            <LineChart
              data={[
                { label: 'GMV', data: analytics.revenueData.gmv, color: 'rgb(245, 158, 11)' },
                { label: 'Platform Fees', data: analytics.revenueData.platformFees, color: 'rgb(234, 179, 8)' },
                { label: 'Payouts', data: analytics.revenueData.payoutVolume, color: 'rgb(113, 113, 122)' }
              ]}
              formatValue={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
          </div>
        </div>
      </Section>

      {/* Top Categories Section */}
      <Section
        title="Top Categories"
        onExport={() => onExportData('categories')}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="text-left py-3 px-4 text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                  Category
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                  Bookings
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="py-3 px-4 text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                  Distribution
                </th>
              </tr>
            </thead>
            <tbody>
              {analytics.topCategories.map((category, index) => {
                const maxRevenue = Math.max(...analytics.topCategories.map(c => c.revenue));
                const percentage = (category.revenue / maxRevenue) * 100;

                return (
                  <tr key={index} className="border-b border-zinc-200/50 dark:border-zinc-800/50 last:border-0">
                    <td className="py-4 px-4 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      {category.category}
                    </td>
                    <td className="py-4 px-4 text-sm text-zinc-700 dark:text-zinc-300 text-right">
                      {category.bookingCount.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-sm text-zinc-700 dark:text-zinc-300 text-right">
                      ${category.revenue.toLocaleString()}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-zinc-600 dark:text-zinc-400 w-12 text-right">
                          {percentage.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Geographical Distribution Section */}
      <Section
        title="Geographical Distribution"
        onExport={() => onExportData('geography')}
      >
        <div className="space-y-4">
          {analytics.geographicalDistribution.map((location, index) => {
            const maxUsers = Math.max(...analytics.geographicalDistribution.map(l => l.userCount));
            const maxBookings = Math.max(...analytics.geographicalDistribution.map(l => l.bookingCount));
            const userPercentage = (location.userCount / maxUsers) * 100;
            const bookingPercentage = (location.bookingCount / maxBookings) * 100;

            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{location.location}</span>
                  <div className="flex items-center gap-4 text-xs text-zinc-600 dark:text-zinc-400">
                    <span>{location.userCount.toLocaleString()} users</span>
                    <span>{location.bookingCount.toLocaleString()} bookings</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <div className="bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all"
                        style={{ width: `${userPercentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-yellow-500 rounded-full transition-all"
                        style={{ width: `${bookingPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Engagement Metrics Section */}
      <Section
        title="Engagement Metrics"
        onExport={() => onExportData('engagement')}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <EngagementCard
            icon="💬"
            label="Messages Sent"
            value={analytics.engagementMetrics.messagesSent.toLocaleString()}
          />
          <EngagementCard
            icon="👁️"
            label="Profile Views"
            value={analytics.engagementMetrics.profileViews.toLocaleString()}
          />
          <EngagementCard
            icon="🔍"
            label="Search Queries"
            value={analytics.engagementMetrics.searchQueries.toLocaleString()}
          />
          <EngagementCard
            icon="⭐"
            label="Review Submissions"
            value={analytics.engagementMetrics.reviewSubmissions.toLocaleString()}
          />
        </div>
      </Section>
    </div>
  );
}

// Helper Components

function Section({
  title,
  onExport,
  children
}: {
  title: string;
  onExport: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
        <button
          onClick={onExport}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-amber-400 transition-colors"
          title="Export data"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export
        </button>
      </div>
      {children}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-zinc-100/50 dark:bg-zinc-800/50 rounded-lg p-4">
      <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">{label}</div>
      <div className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
        {value.toLocaleString()}
      </div>
    </div>
  );
}

function RevenueCard({
  label,
  value,
  trend
}: {
  label: string;
  value: number;
  trend: number;
}) {
  const isPositive = trend >= 0;

  return (
    <div className="bg-zinc-100/50 dark:bg-zinc-800/50 rounded-lg p-4">
      <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">{label}</div>
      <div className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
        ${(value / 1000).toFixed(1)}k
      </div>
      <div className={`flex items-center gap-1 text-xs ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
        <span>{isPositive ? '↑' : '↓'}</span>
        <span>{Math.abs(trend).toFixed(1)}%</span>
        <span className="text-zinc-500 dark:text-zinc-500">vs. previous period</span>
      </div>
    </div>
  );
}

function EngagementCard({
  icon,
  label,
  value
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-zinc-100/50 dark:bg-zinc-800/50 rounded-lg p-4">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">{label}</div>
      <div className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{value}</div>
    </div>
  );
}

// Chart Components

function LineChart({
  data,
  formatValue = (v) => v.toString()
}: {
  data: Array<{ label: string; data: TimeSeriesData[]; color: string }>;
  formatValue?: (value: number) => string;
}) {
  if (!data.length || !data[0].data.length) {
    return (
      <div className="h-64 flex items-center justify-center text-zinc-500">
        No data available
      </div>
    );
  }

  const width = 800;
  const height = 240;
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };

  // Calculate bounds
  const allValues = data.flatMap(series => series.data.map(d => d.value));
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const valueRange = maxValue - minValue;

  // Scale functions
  const xScale = (index: number, total: number) =>
    padding.left + ((width - padding.left - padding.right) * index) / (total - 1);

  const yScale = (value: number) =>
    height - padding.bottom - ((value - minValue) / valueRange) * (height - padding.top - padding.bottom);

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
          const y = height - padding.bottom - fraction * (height - padding.top - padding.bottom);
          const value = minValue + fraction * valueRange;

          return (
            <g key={fraction}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="rgb(39, 39, 42)"
                strokeWidth="1"
              />
              <text
                x={padding.left - 10}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                className="text-[10px] fill-zinc-500"
              >
                {formatValue(value)}
              </text>
            </g>
          );
        })}

        {/* X-axis labels (every 5th point) */}
        {data[0].data.map((point, index) => {
          if (index % Math.ceil(data[0].data.length / 6) !== 0 && index !== data[0].data.length - 1) return null;

          return (
            <text
              key={index}
              x={xScale(index, data[0].data.length)}
              y={height - padding.bottom + 20}
              textAnchor="middle"
              className="text-[10px] fill-zinc-500"
            >
              {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </text>
          );
        })}

        {/* Lines */}
        {data.map((series, seriesIndex) => {
          const points = series.data
            .map((point, i) => `${xScale(i, series.data.length)},${yScale(point.value)}`)
            .join(' ');

          return (
            <g key={seriesIndex}>
              <polyline
                points={points}
                fill="none"
                stroke={series.color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {series.data.map((point, i) => (
                <circle
                  key={i}
                  cx={xScale(i, series.data.length)}
                  cy={yScale(point.value)}
                  r="3"
                  fill={series.color}
                />
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function BarChart({
  data
}: {
  data: Array<{ label: string; data: TimeSeriesData[]; color: string }>;
}) {
  if (!data.length || !data[0].data.length) {
    return (
      <div className="h-64 flex items-center justify-center text-zinc-500">
        No data available
      </div>
    );
  }

  const width = 800;
  const height = 240;
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };

  const allValues = data.flatMap(series => series.data.map(d => d.value));
  const maxValue = Math.max(...allValues);

  const barWidth = (width - padding.left - padding.right) / data[0].data.length;
  const groupWidth = barWidth / data.length;

  const yScale = (value: number) =>
    height - padding.bottom - (value / maxValue) * (height - padding.top - padding.bottom);

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
          const y = height - padding.bottom - fraction * (height - padding.top - padding.bottom);
          const value = fraction * maxValue;

          return (
            <g key={fraction}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="rgb(39, 39, 42)"
                strokeWidth="1"
              />
              <text
                x={padding.left - 10}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                className="text-[10px] fill-zinc-500"
              >
                {value.toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((series, seriesIndex) =>
          series.data.map((point, pointIndex) => {
            const x = padding.left + pointIndex * barWidth + seriesIndex * groupWidth;
            const barHeight = (point.value / maxValue) * (height - padding.top - padding.bottom);

            return (
              <rect
                key={`${seriesIndex}-${pointIndex}`}
                x={x}
                y={yScale(point.value)}
                width={groupWidth * 0.8}
                height={barHeight}
                fill={series.color}
                rx="2"
              />
            );
          })
        )}

        {/* X-axis labels */}
        {data[0].data.map((point, index) => {
          if (index % Math.ceil(data[0].data.length / 6) !== 0 && index !== data[0].data.length - 1) return null;

          return (
            <text
              key={index}
              x={padding.left + index * barWidth + barWidth / 2}
              y={height - padding.bottom + 20}
              textAnchor="middle"
              className="text-[10px] fill-zinc-500"
            >
              {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

// Helper Functions

function calculateTotal(data: TimeSeriesData[]): number {
  return data.reduce((sum, point) => sum + point.value, 0);
}

function calculateTrend(data: TimeSeriesData[]): number {
  if (data.length < 2) return 0;

  const midpoint = Math.floor(data.length / 2);
  const firstHalf = data.slice(0, midpoint);
  const secondHalf = data.slice(midpoint);

  const firstAvg = firstHalf.reduce((sum, p) => sum + p.value, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, p) => sum + p.value, 0) / secondHalf.length;

  if (firstAvg === 0) return 0;

  return ((secondAvg - firstAvg) / firstAvg) * 100;
}
