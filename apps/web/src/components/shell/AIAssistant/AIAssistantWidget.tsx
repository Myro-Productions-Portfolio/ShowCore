import type { AIAssistantWidgetProps } from '@/sections/dashboard-and-onboarding/ai-assistant-types'
import { AIAssistantButton } from './AIAssistantButton'
import { AIAssistantPanel } from './AIAssistantPanel'

/**
 * Main AI Assistant Widget
 *
 * Manages the AI assistant state and renders either the floating button
 * or the expanded panel based on the current state.
 */
export function AIAssistantWidget({
  state,
  conversation,
  quickActions,
  onStateChange,
  onSendMessage,
  onActionClick,
  onQuickActionClick,
  isTyping,
}: AIAssistantWidgetProps) {
  const handleOpen = () => onStateChange('open')
  const handleClose = () => onStateChange('closed')
  const handleMinimize = () => onStateChange('minimized')

  // Check if there are unread messages (assistant messages after the last user message)
  const hasUnreadMessages = conversation.messages.length > 0 &&
    conversation.messages[conversation.messages.length - 1].sender === 'assistant' &&
    state === 'closed'

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {state === 'open' ? (
        <AIAssistantPanel
          conversation={conversation}
          quickActions={quickActions}
          isTyping={isTyping}
          onSendMessage={onSendMessage}
          onActionClick={onActionClick}
          onQuickActionClick={onQuickActionClick}
          onMinimize={handleMinimize}
          onClose={handleClose}
        />
      ) : (
        <AIAssistantButton
          state={state}
          hasUnreadMessages={hasUnreadMessages}
          onClick={handleOpen}
        />
      )}
    </div>
  )
}
