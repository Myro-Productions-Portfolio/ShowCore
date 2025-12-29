import { useState } from 'react'
import { ChevronDown, X, MapPin, DollarSign, BadgeCheck, Shield } from 'lucide-react'
import type { FilterPanelProps, TechnicianTier } from '../types'

interface FilterSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

function FilterSection({ title, children, defaultOpen = true }: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-zinc-100 dark:border-zinc-800 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
      >
        {title}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && <div className="pb-4">{children}</div>}
    </div>
  )
}

export function FilterPanel({ filters, searchState, onChange, onClear }: FilterPanelProps) {
  const hasActiveFilters =
    searchState.selectedSkills.length > 0 ||
    searchState.selectedTiers.length > 0 ||
    searchState.verifiedOnly ||
    searchState.insuredOnly ||
    searchState.rateMin > filters.rateRange.min ||
    searchState.rateMax < filters.rateRange.max

  const handleSkillToggle = (skill: string) => {
    const newSkills = searchState.selectedSkills.includes(skill)
      ? searchState.selectedSkills.filter((s) => s !== skill)
      : [...searchState.selectedSkills, skill]
    onChange?.({ selectedSkills: newSkills })
  }

  const handleTierToggle = (tier: TechnicianTier) => {
    const newTiers = searchState.selectedTiers.includes(tier)
      ? searchState.selectedTiers.filter((t) => t !== tier)
      : [...searchState.selectedTiers, tier]
    onChange?.({ selectedTiers: newTiers })
  }

  const tierColors: Record<TechnicianTier, string> = {
    Beginner: 'border-zinc-300 dark:border-zinc-600 data-[selected=true]:bg-zinc-100 dark:data-[selected=true]:bg-zinc-800 data-[selected=true]:border-zinc-400',
    Experienced: 'border-blue-300 dark:border-blue-700 data-[selected=true]:bg-blue-50 dark:data-[selected=true]:bg-blue-900/30 data-[selected=true]:border-blue-400',
    Advanced: 'border-purple-300 dark:border-purple-700 data-[selected=true]:bg-purple-50 dark:data-[selected=true]:bg-purple-900/30 data-[selected=true]:border-purple-400',
    Pro: 'border-amber-300 dark:border-amber-700 data-[selected=true]:bg-amber-50 dark:data-[selected=true]:bg-amber-900/30 data-[selected=true]:border-amber-400',
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="text-xs text-amber-800 dark:text-amber-100 hover:text-amber-900 dark:hover:text-amber-50 font-medium"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Location */}
      <FilterSection title="Location">
        <div className="space-y-3">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchState.locationZip}
              onChange={(e) => onChange?.({ locationZip: e.target.value })}
              placeholder="ZIP Code"
              className="w-full pl-9 pr-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-2 block">
              Radius: <span className="font-medium text-zinc-700 dark:text-zinc-300">{searchState.radius} miles</span>
            </label>
            <input
              type="range"
              min={5}
              max={100}
              step={5}
              value={searchState.radius}
              onChange={(e) => onChange?.({ radius: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-xs text-zinc-400 mt-1">
              <span>5 mi</span>
              <span>100 mi</span>
            </div>
          </div>
        </div>
      </FilterSection>

      {/* Tier */}
      <FilterSection title="Tier">
        <div className="grid grid-cols-2 gap-2">
          {filters.tiers.map((tier) => (
            <button
              key={tier}
              data-selected={searchState.selectedTiers.includes(tier)}
              onClick={() => handleTierToggle(tier)}
              className={`px-3 py-2 text-xs font-medium rounded-lg border-2 transition-all ${tierColors[tier]} ${
                searchState.selectedTiers.includes(tier)
                  ? 'text-zinc-900 dark:text-zinc-100'
                  : 'text-zinc-500 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500'
              }`}
            >
              {tier}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Skills */}
      <FilterSection title="Skills">
        <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
          {filters.availableSkills.map((skill) => (
            <button
              key={skill}
              onClick={() => handleSkillToggle(skill)}
              className={`px-2.5 py-1 text-xs font-medium rounded-full transition-all ${
                searchState.selectedSkills.includes(skill)
                  ? 'bg-amber-500 text-white'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              {skill}
              {searchState.selectedSkills.includes(skill) && (
                <X className="inline-block w-3 h-3 ml-1" />
              )}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Hourly Rate */}
      <FilterSection title="Hourly Rate">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="number"
                value={searchState.rateMin}
                onChange={(e) => onChange?.({ rateMin: parseInt(e.target.value) || filters.rateRange.min })}
                min={filters.rateRange.min}
                max={searchState.rateMax}
                className="w-full pl-7 pr-2 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>
            <span className="text-zinc-400">—</span>
            <div className="relative flex-1">
              <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="number"
                value={searchState.rateMax}
                onChange={(e) => onChange?.({ rateMax: parseInt(e.target.value) || filters.rateRange.max })}
                min={searchState.rateMin}
                max={filters.rateRange.max}
                className="w-full pl-7 pr-2 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>
          </div>
        </div>
      </FilterSection>

      {/* Verification Toggles */}
      <FilterSection title="Verification">
        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer group">
            <div className="flex items-center gap-2">
              <BadgeCheck className="w-4 h-4 text-amber-500" />
              <span className="text-sm text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100">
                Verified only
              </span>
            </div>
            <button
              onClick={() => onChange?.({ verifiedOnly: !searchState.verifiedOnly })}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                searchState.verifiedOnly ? 'bg-amber-500' : 'bg-zinc-200 dark:bg-zinc-700'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  searchState.verifiedOnly ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </label>

          <label className="flex items-center justify-between cursor-pointer group">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span className="text-sm text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100">
                Insured only
              </span>
            </div>
            <button
              onClick={() => onChange?.({ insuredOnly: !searchState.insuredOnly })}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                searchState.insuredOnly ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-700'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  searchState.insuredOnly ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </label>
        </div>
      </FilterSection>
    </div>
  )
}
