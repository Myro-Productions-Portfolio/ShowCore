import { useState, useRef, useEffect } from 'react'
import { X, Minus, Send } from 'lucide-react'
import type { AIAssistantPanelProps } from '@/sections/dashboard-and-onboarding/ai-assistant-types'
import { AIMessage } from './AIMessage'
import { QuickActionsGrid } from './QuickActionsGrid'

/**
 * AI Assistant Panel
 *
 * Expandable chat panel that displays the conversation history,
 * quick actions, and message input.
 */
export function AIAssistantPanel({
  conversation,
  quickActions,
  isTyping,
  onSendMessage,
  onActionClick,
  onQuickActionClick,
  onMinimize,
  onClose,
}: AIAssistantPanelProps) {
  const [inputValue, setInputValue] = useState('')
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation.messages, isTyping])

  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return

    const message = inputValue.trim()
    setInputValue('')
    setIsSending(true)

    try {
      await onSendMessage(message)
    } finally {
      setIsSending(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const showQuickActions = conversation.messages.length === 0 && quickActions.length > 0

  return (
    <div className="flex w-[400px] flex-col rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl border border-zinc-200 dark:border-zinc-800">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500"></div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            AI Assistant
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onMinimize}
            className="rounded-lg p-1.5 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Minimize"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 min-h-[300px] max-h-[400px] space-y-4">
        {showQuickActions ? (
          <QuickActionsGrid
            actions={quickActions}
            onActionClick={onQuickActionClick}
          />
        ) : (
          <>
            {conversation.messages.map((message) => (
              <AIMessage
                key={message.id}
                message={message}
                onActionClick={onActionClick}
              />
            ))}
            {isTyping && (
              <div className="flex items-start gap-2">
                <div className="rounded-2xl rounded-tl-sm bg-zinc-100 dark:bg-zinc-800 px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-zinc-400 dark:bg-zinc-600 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="h-2 w-2 rounded-full bg-zinc-400 dark:bg-zinc-600 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="h-2 w-2 rounded-full bg-zinc-400 dark:bg-zinc-600 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 p-4">
        <div className="flex items-end gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            disabled={isSending}
            className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isSending}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white transition-colors hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-amber-500"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
