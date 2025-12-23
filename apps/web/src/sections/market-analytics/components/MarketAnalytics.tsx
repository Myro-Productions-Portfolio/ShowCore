import { useState } from 'react'
import {
  BarChart3,
  TrendingUp,
  Eye,
  EyeOff,
  Lock,
  Sparkles,
  AlertCircle,
  Save,
  LayoutGrid,
} from 'lucide-react'
import type { MarketAnalyticsProps } from '../types'
import { MetricCard } from './MetricCard'
import { FilterPanel } from './FilterPanel'
import { LineChart, BarChart, DistributionChart } from './ChartPlaceholder'
import { InsightCard } from './InsightCard'
import { EventComparison } from './EventComparison'
import { SavedLayouts } from './SavedLayouts'

export function MarketAnalytics({
  data,
  onFilterChange,
  onDateRangeChange,
  onSaveLayout,
  onLoadLayout,
  onDeleteLayout,
  onSetDefaultLayout,
  onChartTypeChange: _onChartTypeChange,
  onTogglePersonalBenchmark,
  onTogglePredictions,
  onCompareEvents: _onCompareEvents,
  onSelectNamedEvent,
  onRequestArchiveAccess,
  onDismissAlert,
  onViewInsightDetails,
  onDismissInsight,
}: MarketAnalyticsProps) {
  const [showPersonalBenchmark, setShowPersonalBenchmark] = useState(true)
  const [showPredictions, setShowPredictions] = useState(true)
  const [activeChartView, setActiveChartView] = useState<
    'trends' | 'comparison' | 'distribution' | 'events'
  >('trends')
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())

  const defaultLayout = data.savedLayouts.find((l) => l.isDefault)
  const [selectedLayoutId, setSelectedLayoutId] = useState<string | undefined>(
    defaultLayout?.id
  )

  const initialFilters = defaultLayout?.filters || {
    skills: ['Audio/Sound'],
    tiers: ['Advanced'],
    regions: ['Los Angeles'],
    eventTypes: ['Concert/Festival'],
    dateRange: {
      start: '2024-03-01',
      end: '2025-03-15',
    },
  }
  const [currentFilters, setCurrentFilters] = useState(initialFilters)

  const handleLoadLayout = (layoutId: string) => {
    setSelectedLayoutId(layoutId)
    const layout = data.savedLayouts.find((l) => l.id === layoutId)
    if (layout) {
      setCurrentFilters(layout.filters)
      if (layout.chartConfiguration) {
        setShowPersonalBenchmark(layout.chartConfiguration.showPersonalBenchmark)
        setShowPredictions(layout.chartConfiguration.showPredictions)
      }
    }
    onLoadLayout?.(layoutId)
  }

  const handleFilterChange = (filters: typeof currentFilters) => {
    setCurrentFilters(filters)
    onFilterChange?.(filters)
  }

  const handleDateRangeChange = (dateRange: typeof currentFilters.dateRange) => {
    setCurrentFilters({ ...currentFilters, dateRange })
    onDateRangeChange?.(dateRange)
  }

  const handleApplyFilters = (filters: typeof currentFilters) => {
    setCurrentFilters(filters)
    onFilterChange?.(filters)
    // In a real app, this would trigger data fetching with the new filters
    console.log('Filters applied:', filters)
  }

  // Prepare chart data from rateDataPoints
  const trendData = data.rateDataPoints
    .filter((point) => point.skill === 'Audio/Sound')
    .sort((a, b) => a.period.localeCompare(b.period))
    .map((point) => ({
      period: point.period,
      value: point.averageRate,
      label: point.period,
    }))

  const personalTrendData = data.personalBenchmark.historicalRates.map(
    (rate) => ({
      period: rate.period,
      value: rate.averageRate,
    })
  )

  const predictionData =
    data.aiInsights
      .find((insight) => insight.type === 'prediction')
      ?.projectedData?.map((proj) => ({
        period: proj.period,
        value: proj.projectedRate,
      })) || []

  const skillComparisonData = Object.entries(
    data.marketOverview.averageMarketRate.bySkill
  ).map(([skill, rate]) => ({
    label: skill,
    value: rate,
  }))

  const tierComparisonData = Object.entries(
    data.marketOverview.averageMarketRate.byTier
  ).map(([tier, rate]) => ({
    label: tier,
    value: rate,
  }))

  // Sample distribution data from first rate data point
  const distributionSample = data.rateDataPoints[0]
  const distributionData = {
    min: distributionSample.minRate,
    percentile25: distributionSample.percentile25,
    percentile50: distributionSample.percentile50,
    percentile75: distributionSample.percentile75,
    max: distributionSample.maxRate,
    average: distributionSample.averageRate,
  }

  const togglePersonalBenchmark = () => {
    setShowPersonalBenchmark(!showPersonalBenchmark)
    onTogglePersonalBenchmark?.(!showPersonalBenchmark)
  }

  const togglePredictions = () => {
    setShowPredictions(!showPredictions)
    onTogglePredictions?.(!showPredictions)
  }

  const handleDismissAlert = (alertId: string) => {
    setDismissedAlerts((prev) => new Set([...prev, alertId]))
    onDismissAlert?.(alertId)
  }

  const visibleAlerts = data.marketOverview.alerts.filter(
    (alert) => !dismissedAlerts.has(alert.id)
  )

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-[1800px] mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              Market Analytics
            </h1>
            <div className="flex items-center gap-3">
              <SavedLayouts
                layouts={data.savedLayouts}
                currentLayoutId={selectedLayoutId}
                onLoadLayout={handleLoadLayout}
                onDeleteLayout={onDeleteLayout}
                onSetDefaultLayout={onSetDefaultLayout}
              />
              <button
                onClick={() => {
                  const layoutName = prompt('Name this layout:')
                  if (layoutName) {
                    onSaveLayout?.({
                      name: layoutName,
                      userId: data.personalBenchmark.userId,
                      filters: currentFilters,
                      chartConfiguration: {
                        visibleCharts: ['line-trend', 'bar-comparison'],
                        primaryChart: 'line-trend',
                        showPersonalBenchmark,
                        showPredictions,
                      },
                      isDefault: false,
                    })
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-amber-500/30 dark:hover:border-amber-500/20 transition-colors"
              >
                <Save className="h-4 w-4 text-zinc-500" />
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Save Layout
                </span>
              </button>
            </div>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400">
            Transparent rate guidance and market trends for AV technicians
          </p>
        </div>

        {/* Alerts */}
        {visibleAlerts.length > 0 && (
          <div className="mb-6 space-y-2">
            {visibleAlerts.map((alert) => {
              const severityColors = {
                info: 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300',
                success:
                  'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300',
                warning:
                  'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300',
                error:
                  'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-300',
              }

              return (
                <div
                  key={alert.id}
                  className={`flex items-start gap-3 p-4 rounded-lg border ${severityColors[alert.severity]}`}
                >
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.message}</p>
                    <p className="text-xs opacity-75 mt-1">
                      {new Date(alert.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDismissAlert(alert.id)}
                    className="text-xs opacity-75 hover:opacity-100"
                  >
                    Dismiss
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Main layout: sidebar + content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <FilterPanel
                filters={currentFilters}
                onFilterChange={handleFilterChange}
                onDateRangeChange={handleDateRangeChange}
                onApplyFilters={handleApplyFilters}
              />
            </div>
          </div>

          {/* Main content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Overview metrics */}
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                Overview
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <MetricCard
                  label="Market Average Rate"
                  value={data.marketOverview.averageMarketRate.overall}
                  size="large"
                  highlight
                />
                <MetricCard
                  label="Your Average Rate"
                  value={
                    data.personalBenchmark.historicalRates[0]?.averageRate || 0
                  }
                  trend={data.personalBenchmark.performanceMetrics.trend}
                  change={
                    data.personalBenchmark.performanceMetrics.averageVsMarket
                  }
                  period="vs market"
                />
                <MetricCard
                  label="Total Bookings"
                  value={`${data.personalBenchmark.performanceMetrics.totalBookingsLast12Months}`}
                />
              </div>
            </div>

            {/* Trending skills */}
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                Trending Skills
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {data.marketOverview.trendingSkills.map((skill) => (
                  <MetricCard
                    key={skill.skill}
                    label={skill.skill}
                    value={skill.currentAvgRate}
                    trend={skill.trend}
                    change={skill.percentageChange}
                    period={skill.period}
                  />
                ))}
              </div>
            </div>

            {/* Chart controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveChartView('trends')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeChartView === 'trends'
                      ? 'bg-amber-500 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  <TrendingUp className="h-4 w-4 inline mr-1.5" />
                  Trends
                </button>
                <button
                  onClick={() => setActiveChartView('comparison')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeChartView === 'comparison'
                      ? 'bg-amber-500 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  <BarChart3 className="h-4 w-4 inline mr-1.5" />
                  Comparison
                </button>
                <button
                  onClick={() => setActiveChartView('distribution')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeChartView === 'distribution'
                      ? 'bg-amber-500 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  <LayoutGrid className="h-4 w-4 inline mr-1.5" />
                  Distribution
                </button>
                <button
                  onClick={() => setActiveChartView('events')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeChartView === 'events'
                      ? 'bg-amber-500 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  Events
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={togglePersonalBenchmark}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    showPersonalBenchmark
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {showPersonalBenchmark ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                  <span>Personal</span>
                </button>
                <button
                  onClick={togglePredictions}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    showPredictions
                      ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  <Sparkles className="h-4 w-4" />
                  <span>AI Predictions</span>
                </button>
              </div>
            </div>

            {/* Charts */}
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
              {activeChartView === 'trends' && (
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-6">
                    Rate Trends Over Time
                  </h3>
                  <LineChart
                    data={trendData}
                    personalData={
                      showPersonalBenchmark ? personalTrendData : undefined
                    }
                    showPredictions={showPredictions}
                    predictedData={predictionData}
                    height={300}
                  />
                </div>
              )}

              {activeChartView === 'comparison' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-6">
                      Average Rates by Skill
                    </h3>
                    <BarChart data={skillComparisonData} height={250} />
                  </div>
                  <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-6">
                      Average Rates by Tier
                    </h3>
                    <BarChart data={tierComparisonData} height={250} />
                  </div>
                </div>
              )}

              {activeChartView === 'distribution' && (
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-6">
                    Rate Distribution
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
                    {distributionSample.skill} • {distributionSample.tier} •{' '}
                    {distributionSample.region} • {distributionSample.eventType}
                  </p>
                  <DistributionChart
                    data={distributionData}
                    personalRate={
                      showPersonalBenchmark
                        ? data.personalBenchmark.historicalRates[0]
                            ?.averageRate
                        : undefined
                    }
                    height={200}
                  />
                </div>
              )}

              {activeChartView === 'events' && (
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-6">
                    Named Event Comparison
                  </h3>
                  <EventComparison
                    events={data.namedEvents}
                    onSelectEvent={onSelectNamedEvent}
                  />
                </div>
              )}
            </div>

            {/* Regional insights */}
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                Regional Insights
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.marketOverview.regionalInsights.map((insight) => (
                  <div
                    key={insight.region}
                    className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {insight.region}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          insight.demandLevel === 'High'
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                            : insight.demandLevel === 'Medium'
                              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                              : 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        {insight.demandLevel}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                          ${insight.averageRate}
                        </span>
                        <span className="text-sm text-zinc-500 dark:text-zinc-400">
                          /hr avg
                        </span>
                      </div>
                      <div className="text-sm text-zinc-600 dark:text-zinc-400">
                        Top: {insight.topSkill}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400">
                        <TrendingUp className="h-4 w-4" />
                        <span>+{insight.percentageChange}% this quarter</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Insights */}
            {data.aiInsights.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    AI-Powered Insights
                  </h2>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {data.aiInsights.map((insight) => (
                    <InsightCard
                      key={insight.id}
                      insight={insight}
                      onViewDetails={onViewInsightDetails}
                      onDismiss={onDismissInsight}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Archive access */}
            {!data.archiveAccess.isEnabled && (
              <div className="rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 p-8 text-center">
                <Lock className="h-12 w-12 text-zinc-400 dark:text-zinc-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                  Historical Archive
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400 mb-4 max-w-md mx-auto">
                  {data.archiveAccess.upgradePrompt}
                </p>
                <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                  Access {data.archiveAccess.availableRange.start} to{' '}
                  {data.archiveAccess.availableRange.end}
                </div>
                {onRequestArchiveAccess && (
                  <button
                    onClick={onRequestArchiveAccess}
                    className="px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium transition-colors"
                  >
                    Upgrade to {data.archiveAccess.requiredTier}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
