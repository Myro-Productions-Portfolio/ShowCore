import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { TrendDirection } from '../types'

export interface MetricCardProps {
  label: string
  value: string | number
  trend?: TrendDirection
  change?: number
  period?: string
  size?: 'default' | 'large'
  highlight?: boolean
}

export function MetricCard({
  label,
  value,
  trend,
  change,
  period,
  size = 'default',
  highlight = false,
}: MetricCardProps) {
  const isLarge = size === 'large'

  return (
    <div
      className={`rounded-lg border transition-all duration-200 ${
        highlight
          ? 'bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border-amber-500/30 dark:border-amber-500/20'
          : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-amber-500/30 dark:hover:border-amber-500/20'
      } ${isLarge ? 'p-6' : 'p-4'}`}
    >
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          {label}
        </p>
        <div className="flex items-baseline gap-2">
          <span
            className={`font-bold text-zinc-900 dark:text-zinc-100 ${
              isLarge ? 'text-4xl' : 'text-2xl'
            }`}
          >
            {typeof value === 'number' ? `$${value}` : value}
          </span>
          {typeof value === 'number' && (
            <span className="text-sm text-zinc-500 dark:text-zinc-400">/hr</span>
          )}
        </div>
        {(trend || change !== undefined) && (
          <div className="flex items-center gap-2 text-sm">
            {trend === 'up' && (
              <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-4 w-4" />
                {change !== undefined && <span>+{change}%</span>}
              </div>
            )}
            {trend === 'down' && (
              <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                <TrendingDown className="h-4 w-4" />
                {change !== undefined && <span>-{Math.abs(change)}%</span>}
              </div>
            )}
            {trend === 'stable' && (
              <div className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
                <Minus className="h-4 w-4" />
                {change !== undefined && <span>{change}%</span>}
              </div>
            )}
            {period && (
              <span className="text-zinc-500 dark:text-zinc-400">{period}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
