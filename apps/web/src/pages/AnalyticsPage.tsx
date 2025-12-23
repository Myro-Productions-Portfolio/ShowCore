import { useState } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { MarketAnalytics } from '@/sections/market-analytics/components'
import analyticsData from '@/sections/market-analytics/data.json'
import type { MarketAnalyticsData } from '@/sections/market-analytics/types'

export function AnalyticsPage() {
  const data = analyticsData as unknown as MarketAnalyticsData

  // State management for analytics page
  const [dateRange, setDateRange] = useState({ start: '2024-01-01', end: '2024-12-31' })
  const [chartType, setChartType] = useState<'line' | 'bar' | 'pie' | 'area'>('line')
  const [layoutPreferences, setLayoutPreferences] = useLocalStorage('showcore_analytics_layout', {
    showPersonalBenchmark: true,
    showPredictions: false,
    defaultView: 'overview'
  })
  const [isLoading, setIsLoading] = useState(false)

  return (
    <MarketAnalytics
      data={data}
      onFilterChange={(filters) => {
        setIsLoading(true)
        // Simulate loading delay for filter changes
        setTimeout(() => {
          console.log('Filter changed:', filters)
          setIsLoading(false)
        }, 400)
      }}
      onDateRangeChange={(dateRange) => {
        setIsLoading(true)
        // Simulate loading delay for date range changes
        setTimeout(() => {
          setDateRange(dateRange)
          setIsLoading(false)
        }, 300)
      }}
      onChartTypeChange={(chartType) => {
        setIsLoading(true)
        // Simulate loading delay for chart type changes
        setTimeout(() => {
          // Map chart types correctly
          const mappedChartType = chartType === 'line-trend' ? 'line' : 
                                 chartType === 'bar-comparison' ? 'bar' : 
                                 chartType as 'line' | 'bar' | 'pie' | 'area'
          setChartType(mappedChartType)
          setIsLoading(false)
        }, 200)
      }}
      onSaveLayout={(layout) => setLayoutPreferences(prev => ({ ...prev, ...layout }))}
      onLoadLayout={(layoutId) => console.log('Load layout:', layoutId)}
      onDeleteLayout={(layoutId) => console.log('Delete layout:', layoutId)}
      onSetDefaultLayout={(layoutId) => console.log('Set default layout:', layoutId)}
      onTogglePersonalBenchmark={(show) => setLayoutPreferences(prev => ({ ...prev, showPersonalBenchmark: show }))}
      onTogglePredictions={(show) => setLayoutPreferences(prev => ({ ...prev, showPredictions: show }))}
      onCompareEvents={(eventIds) => console.log('Compare events:', eventIds)}
      onSelectNamedEvent={(eventId) => console.log('Select named event:', eventId)}
      onRequestArchiveAccess={() => console.log('Request archive access')}
      onDismissAlert={(alertId) => console.log('Dismiss alert:', alertId)}
      onViewInsightDetails={(insightId) => console.log('View insight details:', insightId)}
      onDismissInsight={(insightId) => console.log('Dismiss insight:', insightId)}
    />
  )
}
