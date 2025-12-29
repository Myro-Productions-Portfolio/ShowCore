// Note: Types are not directly imported to avoid build issues
// Instead, data is passed via props with proper typing from parent component

export interface LineChartProps {
  data: Array<{ period: string; value: number; label?: string }>
  personalData?: Array<{ period: string; value: number }>
  showPredictions?: boolean
  predictedData?: Array<{ period: string; value: number }>
  height?: number
}

export function LineChart({
  data,
  personalData,
  showPredictions,
  predictedData,
  height = 200,
}: LineChartProps) {
  // Calculate value range for Y-axis scaling
  const allValues = [
    ...data.map((d) => d.value),
    ...(personalData?.map((d) => d.value) || []),
    ...(predictedData?.map((d) => d.value) || []),
  ]
  const maxValue = Math.max(...allValues)
  const minValue = Math.min(...allValues)
  // Add 10% padding to the range
  const valuePadding = (maxValue - minValue) * 0.1 || 5
  const paddedMin = minValue - valuePadding
  const paddedMax = maxValue + valuePadding
  const range = paddedMax - paddedMin

  // Total time periods including predictions
  const totalPeriods = data.length + (showPredictions && predictedData ? predictedData.length : 0)

  // Get X position (0-100 for viewBox)
  const getX = (index: number, startOffset: number = 0) => {
    const totalIdx = startOffset + index
    return (totalIdx / Math.max(totalPeriods - 1, 1)) * 100
  }

  // Get Y position (0-100 for viewBox, inverted so higher values are at top)
  const getY = (value: number) => {
    return 100 - ((value - paddedMin) / range) * 100
  }

  // Create SVG path string for a line
  const createPath = (points: Array<{ value: number }>, startOffset: number = 0) => {
    if (points.length === 0) return ''
    return points
      .map((d, i) => {
        const x = getX(i, startOffset)
        const y = getY(d.value)
        return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`
      })
      .join(' ')
  }

  return (
    <div className="relative" style={{ height: `${height}px` }}>
      {/* Grid lines */}
      <div className="absolute inset-0">
        {[0, 25, 50, 75, 100].map((percent) => (
          <div
            key={percent}
            className="absolute w-full border-t border-zinc-200 dark:border-zinc-800"
            style={{ top: `${percent}%` }}
          />
        ))}
      </div>

      {/* SVG for lines - uses viewBox for proper scaling */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {/* Market average line */}
        <path
          d={createPath(data)}
          fill="none"
          stroke="#f59e0b"
          strokeWidth="0.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Personal benchmark line */}
        {personalData && personalData.length > 0 && (
          <path
            d={createPath(personalData)}
            fill="none"
            stroke="#10b981"
            strokeWidth="0.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Predicted data line - starts after main data */}
        {showPredictions && predictedData && predictedData.length > 0 && (
          <path
            d={createPath(predictedData, data.length - 1)}
            fill="none"
            stroke="#fbbf24"
            strokeWidth="0.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="2,1"
            opacity="0.8"
          />
        )}
      </svg>

      {/* Data points as positioned divs (scale independently) */}
      <div className="absolute inset-0">
        {data.map((d, i) => (
          <div
            key={`market-${i}`}
            className="absolute w-3 h-3 rounded-full bg-amber-500 -translate-x-1/2 -translate-y-1/2 shadow-sm"
            style={{
              left: `${getX(i)}%`,
              top: `${getY(d.value)}%`,
            }}
          />
        ))}

        {personalData?.map((d, i) => (
          <div
            key={`personal-${i}`}
            className="absolute w-3 h-3 rounded-full bg-emerald-500 -translate-x-1/2 -translate-y-1/2 shadow-sm"
            style={{
              left: `${getX(i)}%`,
              top: `${getY(d.value)}%`,
            }}
          />
        ))}

        {showPredictions && predictedData?.map((d, i) => (
          <div
            key={`predicted-${i}`}
            className="absolute w-2.5 h-2.5 rounded-full bg-amber-400 opacity-80 -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${getX(i, data.length - 1)}%`,
              top: `${getY(d.value)}%`,
            }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="absolute -bottom-8 left-0 flex gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-amber-500" />
          <span className="text-zinc-600 dark:text-zinc-400">Market Avg</span>
        </div>
        {personalData && (
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-zinc-600 dark:text-zinc-400">Your Rates</span>
          </div>
        )}
        {showPredictions && predictedData && (
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-amber-400 opacity-80" />
            <span className="text-zinc-600 dark:text-zinc-400">Predicted</span>
          </div>
        )}
      </div>
    </div>
  )
}

export interface BarChartProps {
  data: Array<{ label: string; value: number; color?: string }>
  height?: number
}

export function BarChart({ data, height = 200 }: BarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value))

  return (
    <div className="space-y-3" style={{ minHeight: `${height}px` }}>
      {data.map((item, i) => {
        const percentage = (item.value / maxValue) * 100
        const barColor = item.color || 'amber'

        return (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                {item.label}
              </span>
              <span className="text-zinc-900 dark:text-zinc-100 font-bold">
                ${item.value}
              </span>
            </div>
            <div className="relative h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 bg-gradient-to-r from-${barColor}-500 to-${barColor}-400 transition-all duration-500 ease-out`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export interface DistributionChartProps {
  data: {
    min: number
    percentile25: number
    percentile50: number
    percentile75: number
    max: number
    average: number
  }
  personalRate?: number
  height?: number
}

export function DistributionChart({
  data,
  personalRate,
  height = 160,
}: DistributionChartProps) {
  const range = data.max - data.min
  const getPosition = (value: number) =>
    ((value - data.min) / range) * 100

  return (
    <div className="space-y-6" style={{ minHeight: `${height}px` }}>
      {/* Box plot visualization */}
      <div className="relative h-20">
        {/* Background scale */}
        <div className="absolute inset-x-0 top-8 h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full" />

        {/* Min and Max markers */}
        <div
          className="absolute top-8 h-1 bg-amber-200 dark:bg-amber-900 rounded-full"
          style={{
            left: `${getPosition(data.min)}%`,
            width: `${getPosition(data.max) - getPosition(data.min)}%`,
          }}
        />

        {/* IQR box (25th to 75th percentile) */}
        <div
          className="absolute top-4 h-12 bg-amber-500 rounded-lg shadow-lg"
          style={{
            left: `${getPosition(data.percentile25)}%`,
            width: `${
              getPosition(data.percentile75) - getPosition(data.percentile25)
            }%`,
          }}
        />

        {/* Median line */}
        <div
          className="absolute top-4 h-12 w-1 bg-white"
          style={{ left: `${getPosition(data.percentile50)}%` }}
        />

        {/* Personal rate marker */}
        {personalRate && (
          <div
            className="absolute top-0 h-20 w-1 bg-emerald-500 rounded-full shadow-lg"
            style={{ left: `${getPosition(personalRate)}%` }}
          >
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium text-emerald-600 dark:text-emerald-400">
              You: ${personalRate}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
        <div>
          <div className="text-zinc-500 dark:text-zinc-400">Minimum</div>
          <div className="font-bold text-zinc-900 dark:text-zinc-100">
            ${data.min}
          </div>
        </div>
        <div>
          <div className="text-zinc-500 dark:text-zinc-400">25th %ile</div>
          <div className="font-bold text-zinc-900 dark:text-zinc-100">
            ${data.percentile25}
          </div>
        </div>
        <div>
          <div className="text-zinc-500 dark:text-zinc-400">Median</div>
          <div className="font-bold text-zinc-900 dark:text-zinc-100">
            ${data.percentile50}
          </div>
        </div>
        <div>
          <div className="text-zinc-500 dark:text-zinc-400">75th %ile</div>
          <div className="font-bold text-zinc-900 dark:text-zinc-100">
            ${data.percentile75}
          </div>
        </div>
        <div>
          <div className="text-zinc-500 dark:text-zinc-400">Maximum</div>
          <div className="font-bold text-zinc-900 dark:text-zinc-100">
            ${data.max}
          </div>
        </div>
        <div>
          <div className="text-zinc-500 dark:text-zinc-400">Average</div>
          <div className="font-bold text-amber-800 dark:text-amber-100">
            ${data.average}
          </div>
        </div>
      </div>
    </div>
  )
}
