import { MessageCircle } from 'lucide-react'
import type { AIAssistantButtonProps } from '@/sections/dashboard-and-onboarding/ai-assistant-types'

/**
 * AI Assistant Floating Button
 *
 * Circular floating action button that opens the AI assistant panel.
 * Shows notification badge when there are unread messages.
 */
export function AIAssistantButton({
  state,
  hasUnreadMessages,
  onClick,
}: AIAssistantButtonProps) {
  return (
    <button
      onClick={onClick}
      className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg transition-all hover:shadow-xl hover:scale-105 active:scale-95"
      aria-label="Open AI Assistant"
    >
      <MessageCircle className="h-6 w-6" />

      {hasUnreadMessages && (
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white shadow-md animate-pulse">
          1
        </span>
      )}
    </button>
  )
}
