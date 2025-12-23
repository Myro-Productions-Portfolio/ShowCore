import { MarketAnalytics } from './components'
import analyticsDataRaw from '../data.json'
import type { MarketAnalyticsData } from '../types'

export default function MarketAnalyticsView() {
  const data = analyticsDataRaw as unknown as MarketAnalyticsData

  return (
    <MarketAnalytics
      data={data}
      onFilterChange={(filters) => {
        console.log('Filter changed:', filters)
      }}
      onDateRangeChange={(dateRange) => {
        console.log('Date range changed:', dateRange)
      }}
      onSaveLayout={(layout) => {
        console.log('Save layout:', layout)
      }}
      onLoadLayout={(layoutId) => {
        console.log('Load layout:', layoutId)
      }}
      onDeleteLayout={(layoutId) => {
        console.log('Delete layout:', layoutId)
      }}
      onSetDefaultLayout={(layoutId) => {
        console.log('Set default layout:', layoutId)
      }}
      onChartTypeChange={(chartType) => {
        console.log('Chart type changed:', chartType)
      }}
      onTogglePersonalBenchmark={(show) => {
        console.log('Toggle personal benchmark:', show)
      }}
      onTogglePredictions={(show) => {
        console.log('Toggle predictions:', show)
      }}
      onCompareEvents={(eventIds) => {
        console.log('Compare events:', eventIds)
      }}
      onSelectNamedEvent={(eventId) => {
        console.log('Select named event:', eventId)
      }}
      onRequestArchiveAccess={() => {
        console.log('Request archive access')
      }}
      onDismissAlert={(alertId) => {
        console.log('Dismiss alert:', alertId)
      }}
      onViewInsightDetails={(insightId) => {
        console.log('View insight details:', insightId)
      }}
      onDismissInsight={(insightId) => {
        console.log('Dismiss insight:', insightId)
      }}
    />
  )
}
