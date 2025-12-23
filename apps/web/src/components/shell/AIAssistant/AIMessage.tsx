import type { AIMessageBubbleProps } from '@/sections/dashboard-and-onboarding/ai-assistant-types'
import { SuggestedActionButton } from './SuggestedActionButton'

/**
 * AI Message Bubble
 *
 * Individual message in the conversation.
 * User messages are right-aligned with amber background.
 * Assistant messages are left-aligned with neutral background.
 */
export function AIMessage({ message, onActionClick }: AIMessageBubbleProps) {
  const isUser = message.sender === 'user'

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
      {/* Message bubble */}
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'rounded-tr-sm bg-amber-500 text-white'
            : 'rounded-tl-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
      </div>

      {/* Timestamp */}
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 px-1">
        {message.relativeTime}
      </p>

      {/* Suggested actions (only for assistant messages) */}
      {!isUser && message.actions && message.actions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {message.actions.map((action) => (
            <SuggestedActionButton
              key={action.id}
              action={action}
              onClick={() => onActionClick(action)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
