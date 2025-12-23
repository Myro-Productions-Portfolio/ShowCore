import { Sparkles, TrendingUp, Award, MapPin, Calendar, X } from 'lucide-react'
import type { AIInsight } from '../types'

export interface InsightCardProps {
  insight: AIInsight
  onViewDetails?: (insightId: string) => void
  onDismiss?: (insightId: string) => void
}

export function InsightCard({
  insight,
  onViewDetails,
  onDismiss,
}: InsightCardProps) {
  const getIcon = () => {
    switch (insight.type) {
      case 'prediction':
        return TrendingUp
      case 'recommendation':
        return Award
      case 'demand-forecast':
        return Calendar
      default:
        return Sparkles
    }
  }

  const Icon = getIcon()

  const getTypeColor = () => {
    switch (insight.type) {
      case 'prediction':
        return 'text-blue-600 dark:text-blue-400 bg-blue-500/10'
      case 'recommendation':
        return 'text-amber-600 dark:text-amber-400 bg-amber-500/10'
      case 'demand-forecast':
        return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
      default:
        return 'text-zinc-600 dark:text-zinc-400 bg-zinc-500/10'
    }
  }

  return (
    <div className="group relative rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 hover:border-amber-500/30 dark:hover:border-amber-500/20 transition-all duration-200">
      {/* Dismiss button */}
      {onDismiss && (
        <button
          onClick={() => onDismiss(insight.id)}
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`rounded-lg p-2 ${getTypeColor()}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
              {insight.title}
            </h4>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800">
              <Sparkles className="h-3 w-3 text-amber-500" />
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                AI
              </span>
            </div>
          </div>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            {insight.message}
          </p>
        </div>
      </div>

      {/* Metadata */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 mb-3">
        {insight.confidence && (
          <div className="flex items-center gap-1">
            <span>Confidence:</span>
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {insight.confidence}%
            </span>
          </div>
        )}
        {insight.timeframe && (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{insight.timeframe}</span>
          </div>
        )}
        {insight.affectedRegions && insight.affectedRegions.length > 0 && (
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span>{insight.affectedRegions.join(', ')}</span>
          </div>
        )}
      </div>

      {/* Potential increase */}
      {insight.potentialIncrease && (
        <div className="rounded-md bg-gradient-to-r from-emerald-500/10 to-amber-500/10 p-3 mb-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Potential increase
            </span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              +{insight.potentialIncrease.percentage}%
            </span>
          </div>
          {insight.potentialIncrease.estimatedRateIncrease && (
            <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              +${insight.potentialIncrease.estimatedRateIncrease}/hr
            </div>
          )}
        </div>
      )}

      {/* Suggested action */}
      {insight.suggestedAction && (
        <div className="rounded-md bg-amber-500/5 p-3 mb-3">
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
            Suggested Action
          </div>
          <div className="text-sm text-zinc-700 dark:text-zinc-300">
            {insight.suggestedAction}
          </div>
        </div>
      )}

      {/* Action button */}
      {onViewDetails && (
        <button
          onClick={() => onViewDetails(insight.id)}
          className="text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
        >
          View details →
        </button>
      )}
    </div>
  )
}
