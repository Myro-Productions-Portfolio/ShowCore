import { HelpCircle, BookOpen, MapPin, CheckCircle } from 'lucide-react'
import type { QuickActionsGridProps, QuickAction } from '@/sections/dashboard-and-onboarding/ai-assistant-types'

/**
 * Quick Actions Grid
 *
 * Displays a grid of quick action buttons when the conversation is empty.
 * Helps users get started with common tasks.
 */
export function QuickActionsGrid({ actions, onActionClick }: QuickActionsGridProps) {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'HelpCircle':
        return HelpCircle
      case 'BookOpen':
        return BookOpen
      case 'MapPin':
        return MapPin
      case 'CheckCircle':
        return CheckCircle
      default:
        return HelpCircle
    }
  }

  const getCategoryColor = (category: QuickAction['category']) => {
    switch (category) {
      case 'onboarding':
        return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30'
      case 'help':
        return 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30'
      case 'navigation':
        return 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/30'
      case 'tasks':
        return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30'
      default:
        return 'bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700'
    }
  }

  return (
    <div className="space-y-3">
      <div className="text-center">
        <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          How can I help you today?
        </h4>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Choose a quick action or ask me anything
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {actions.map((action) => {
          const Icon = getIcon(action.icon)
          const colorClass = getCategoryColor(action.category)

          return (
            <button
              key={action.id}
              onClick={() => onActionClick(action)}
              className={`flex flex-col items-center gap-2 rounded-lg border p-3 text-center transition-colors ${colorClass}`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium leading-tight">
                {action.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
