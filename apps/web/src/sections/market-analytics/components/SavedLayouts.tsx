import { Check, ChevronDown, Star, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { SavedLayout } from '../types'

export interface SavedLayoutsProps {
  layouts: SavedLayout[]
  currentLayoutId?: string
  onLoadLayout?: (layoutId: string) => void
  onDeleteLayout?: (layoutId: string) => void
  onSetDefaultLayout?: (layoutId: string) => void
}

export function SavedLayouts({
  layouts,
  currentLayoutId,
  onLoadLayout,
  onDeleteLayout,
  onSetDefaultLayout,
}: SavedLayoutsProps) {
  const [isOpen, setIsOpen] = useState(false)

  const currentLayout = layouts.find((l) => l.id === currentLayoutId)

  if (layouts.length === 0) {
    return null
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-amber-500/30 dark:hover:border-amber-500/20 transition-colors"
      >
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {currentLayout?.name || 'Select layout'}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-zinc-500 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full mt-2 left-0 z-20 w-80 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl">
            <div className="p-2 max-h-96 overflow-y-auto">
              {layouts.map((layout) => (
                <div
                  key={layout.id}
                  className="group relative rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <button
                    onClick={() => {
                      onLoadLayout?.(layout.id)
                      setIsOpen(false)
                    }}
                    className="w-full text-left p-3"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                          {layout.name}
                        </span>
                        {layout.isDefault && (
                          <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                        )}
                      </div>
                      {currentLayoutId === layout.id && (
                        <Check className="h-4 w-4 text-amber-500 flex-shrink-0" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap gap-1">
                        {layout.filters.skills.length > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-600 dark:text-zinc-400">
                            {layout.filters.skills.length} skill
                            {layout.filters.skills.length !== 1 ? 's' : ''}
                          </span>
                        )}
                        {layout.filters.tiers.length > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-600 dark:text-zinc-400">
                            {layout.filters.tiers.length} tier
                            {layout.filters.tiers.length !== 1 ? 's' : ''}
                          </span>
                        )}
                        {layout.filters.regions.length > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-600 dark:text-zinc-400">
                            {layout.filters.regions.length} region
                            {layout.filters.regions.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        Modified{' '}
                        {new Date(layout.lastModified).toLocaleDateString()}
                      </div>
                    </div>
                  </button>

                  {/* Action buttons (visible on hover) */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    {!layout.isDefault && onSetDefaultLayout && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onSetDefaultLayout(layout.id)
                        }}
                        className="p-1.5 rounded-md hover:bg-amber-500/10 text-amber-800 dark:text-amber-100"
                        title="Set as default"
                      >
                        <Star className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {onDeleteLayout && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (
                            confirm(
                              `Delete "${layout.name}" layout?`
                            )
                          ) {
                            onDeleteLayout(layout.id)
                          }
                        }}
                        className="p-1.5 rounded-md hover:bg-red-500/10 text-red-600 dark:text-red-400"
                        title="Delete layout"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
