import { ArrowRight, ExternalLink, Maximize2, Info } from 'lucide-react'
import type { SuggestedAction } from '@/sections/dashboard-and-onboarding/ai-assistant-types'

interface SuggestedActionButtonProps {
  action: SuggestedAction
  onClick: () => void
}

/**
 * Suggested Action Button
 *
 * Compact pill button for suggested actions in assistant messages.
 * Shows appropriate icon based on action type.
 */
export function SuggestedActionButton({ action, onClick }: SuggestedActionButtonProps) {
  // Determine icon based on action type
  const getIcon = () => {
    switch (action.type) {
      case 'external':
        return ExternalLink
      case 'modal':
        return Maximize2
      case 'inline':
        return Info
      default:
        return ArrowRight
    }
  }

  const Icon = getIcon()

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 text-xs font-medium text-amber-800 dark:text-amber-100 transition-colors hover:bg-amber-100 dark:hover:bg-amber-900/30 hover:border-amber-300 dark:hover:border-amber-700"
      title={action.description}
    >
      <Icon className="h-3 w-3" />
      <span>{action.label}</span>
    </button>
  )
}
