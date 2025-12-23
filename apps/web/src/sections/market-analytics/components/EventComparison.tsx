import { Calendar, Users, DollarSign, TrendingUp } from 'lucide-react'
import type { NamedEvent } from '../types'

export interface EventComparisonProps {
  events: NamedEvent[]
  onSelectEvent?: (eventId: string) => void
  selectedEventIds?: string[]
}

export function EventComparison({
  events,
  onSelectEvent,
  selectedEventIds = [],
}: EventComparisonProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
        No events to compare
      </div>
    )
  }

  // Group events by name for year-over-year comparison
  const eventsByName = events.reduce(
    (acc, event) => {
      if (!acc[event.name]) {
        acc[event.name] = []
      }
      acc[event.name].push(event)
      return acc
    },
    {} as Record<string, NamedEvent[]>
  )

  return (
    <div className="space-y-6">
      {Object.entries(eventsByName).map(([eventName, eventYears]) => {
        // Sort by year descending
        const sortedEvents = [...eventYears].sort((a, b) => b.year - a.year)
        const latestEvent = sortedEvents[0]
        const previousEvent = sortedEvents[1]

        let rateChange: number | null = null
        let technicianChange: number | null = null

        if (previousEvent) {
          rateChange =
            ((latestEvent.rateData.averageRate -
              previousEvent.rateData.averageRate) /
              previousEvent.rateData.averageRate) *
            100
          technicianChange =
            ((latestEvent.rateData.technicianCount -
              previousEvent.rateData.technicianCount) /
              previousEvent.rateData.technicianCount) *
            100
        }

        return (
          <div
            key={eventName}
            className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 p-4 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">
                {eventName}
              </h3>
              <div className="flex items-center gap-2 mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                <Calendar className="h-4 w-4" />
                <span>{latestEvent.location}</span>
                <span>•</span>
                <span className="capitalize">{latestEvent.eventType}</span>
              </div>
            </div>

            {/* Comparison grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
              {sortedEvents.slice(0, 2).map((event, index) => (
                <button
                  key={event.id}
                  onClick={() => onSelectEvent?.(event.id)}
                  className={`text-left rounded-lg border p-4 transition-all ${
                    selectedEventIds.includes(event.id)
                      ? 'border-amber-500 bg-amber-500/5'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-amber-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                      {event.year}
                    </span>
                    {index === 0 && (
                      <span className="px-2 py-1 rounded-full bg-amber-500 text-xs font-medium text-white">
                        Latest
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                        <DollarSign className="h-4 w-4" />
                        <span>Avg Rate</span>
                      </div>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">
                        ${event.rateData.averageRate}/hr
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                        <Users className="h-4 w-4" />
                        <span>Technicians</span>
                      </div>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">
                        {event.rateData.technicianCount}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                        Top Skills
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {event.rateData.topSkills.map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-700 dark:text-zinc-300"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Year-over-year changes */}
            {previousEvent && (rateChange !== null || technicianChange !== null) && (
              <div className="px-4 pb-4">
                <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Year-over-Year Change
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {rateChange !== null && (
                      <div>
                        <span className="text-zinc-500 dark:text-zinc-400">
                          Rates
                        </span>
                        <div
                          className={`font-bold ${
                            rateChange >= 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {rateChange >= 0 ? '+' : ''}
                          {rateChange.toFixed(1)}%
                        </div>
                      </div>
                    )}
                    {technicianChange !== null && (
                      <div>
                        <span className="text-zinc-500 dark:text-zinc-400">
                          Technicians
                        </span>
                        <div
                          className={`font-bold ${
                            technicianChange >= 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {technicianChange >= 0 ? '+' : ''}
                          {technicianChange.toFixed(1)}%
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
