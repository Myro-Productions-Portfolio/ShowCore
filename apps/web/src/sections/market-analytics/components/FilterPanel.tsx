import { useState } from 'react'
import { ChevronDown, Filter } from 'lucide-react'
import type {
  Skill,
  Tier,
  Region,
  EventType,
  LayoutFilters,
  DateRange,
} from '../types'

const SKILLS: Skill[] = ['Audio/Sound', 'Lighting', 'Video', 'LED Wall', 'Rigging']
const TIERS: Tier[] = ['Beginner', 'Intermediate', 'Advanced', 'Pro', 'Master']
const REGIONS: Region[] = ['Los Angeles', 'New York', 'Nashville', 'Austin', 'Miami']
const EVENT_TYPES: EventType[] = [
  'Concert/Festival',
  'Corporate',
  'Theatre',
  'Broadcast',
  'Wedding',
]

export interface FilterPanelProps {
  filters: LayoutFilters
  onFilterChange?: (filters: LayoutFilters) => void
  onDateRangeChange?: (dateRange: DateRange) => void
  onApplyFilters?: (filters: LayoutFilters) => void
}

export function FilterPanel({
  filters,
  onFilterChange,
  onDateRangeChange,
  onApplyFilters,
}: FilterPanelProps) {
  const [expanded, setExpanded] = useState({
    skills: true,
    tiers: true,
    regions: false,
    eventTypes: false,
  })

  const toggleSection = (section: keyof typeof expanded) => {
    setExpanded({ ...expanded, [section]: !expanded[section] })
  }

  const toggleFilter = <K extends keyof LayoutFilters>(
    key: K,
    value: LayoutFilters[K] extends Array<infer U> ? U : never
  ) => {
    const currentValues = filters[key] as any[]
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value]

    onFilterChange?.({
      ...filters,
      [key]: newValues,
    })
  }

  const clearAll = () => {
    onFilterChange?.({
      skills: [],
      tiers: [],
      regions: [],
      eventTypes: [],
      dateRange: filters.dateRange,
    })
  }

  const activeFilterCount =
    filters.skills.length +
    filters.tiers.length +
    filters.regions.length +
    filters.eventTypes.length

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
            Filters
          </h3>
          {activeFilterCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-xs font-medium text-white">
              {activeFilterCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {onApplyFilters && (
            <button
              onClick={() => onApplyFilters(filters)}
              className="px-3 py-1 text-sm font-medium rounded-md bg-amber-500 hover:bg-amber-600 text-white transition-colors"
            >
              Apply
            </button>
          )}
          {activeFilterCount > 0 && (
            <button
              onClick={clearAll}
              className="text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-medium"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Filter sections */}
      <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
        {/* Skills */}
        <FilterSection
          title="Skills"
          count={filters.skills.length}
          expanded={expanded.skills}
          onToggle={() => toggleSection('skills')}
        >
          <div className="space-y-2">
            {SKILLS.map((skill) => (
              <FilterCheckbox
                key={skill}
                label={skill}
                checked={filters.skills.includes(skill)}
                onChange={() => toggleFilter('skills', skill)}
              />
            ))}
          </div>
        </FilterSection>

        {/* Tiers */}
        <FilterSection
          title="Tier Levels"
          count={filters.tiers.length}
          expanded={expanded.tiers}
          onToggle={() => toggleSection('tiers')}
        >
          <div className="space-y-2">
            {TIERS.map((tier) => (
              <FilterCheckbox
                key={tier}
                label={tier}
                checked={filters.tiers.includes(tier)}
                onChange={() => toggleFilter('tiers', tier)}
              />
            ))}
          </div>
        </FilterSection>

        {/* Regions */}
        <FilterSection
          title="Regions"
          count={filters.regions.length}
          expanded={expanded.regions}
          onToggle={() => toggleSection('regions')}
        >
          <div className="space-y-2">
            {REGIONS.map((region) => (
              <FilterCheckbox
                key={region}
                label={region}
                checked={filters.regions.includes(region)}
                onChange={() => toggleFilter('regions', region)}
              />
            ))}
          </div>
        </FilterSection>

        {/* Event Types */}
        <FilterSection
          title="Event Types"
          count={filters.eventTypes.length}
          expanded={expanded.eventTypes}
          onToggle={() => toggleSection('eventTypes')}
        >
          <div className="space-y-2">
            {EVENT_TYPES.map((eventType) => (
              <FilterCheckbox
                key={eventType}
                label={eventType}
                checked={filters.eventTypes.includes(eventType)}
                onChange={() => toggleFilter('eventTypes', eventType)}
              />
            ))}
          </div>
        </FilterSection>

        {/* Date Range */}
        <div className="p-4">
          <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-3">
            Date Range
          </h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={filters.dateRange.start}
                onChange={(e) =>
                  onDateRangeChange?.({
                    ...filters.dateRange,
                    start: e.target.value,
                  })
                }
                className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={filters.dateRange.end}
                onChange={(e) =>
                  onDateRangeChange?.({
                    ...filters.dateRange,
                    end: e.target.value,
                  })
                }
                className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface FilterSectionProps {
  title: string
  count: number
  expanded: boolean
  onToggle: () => void
  children: React.ReactNode
}

function FilterSection({
  title,
  count,
  expanded,
  onToggle,
  children,
}: FilterSectionProps) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {title}
          </span>
          {count > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500/10 px-1.5 text-xs font-medium text-amber-700 dark:text-amber-300">
              {count}
            </span>
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-zinc-500 dark:text-zinc-400 transition-transform ${
            expanded ? 'rotate-180' : ''
          }`}
        />
      </button>
      {expanded && <div className="px-4 pb-4">{children}</div>}
    </div>
  )
}

interface FilterCheckboxProps {
  label: string
  checked: boolean
  onChange: () => void
}

function FilterCheckbox({ label, checked, onChange }: FilterCheckboxProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-600 text-amber-500 focus:ring-2 focus:ring-amber-500 focus:ring-offset-0 bg-white dark:bg-zinc-800"
      />
      <span className="text-sm text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100">
        {label}
      </span>
    </label>
  )
}
