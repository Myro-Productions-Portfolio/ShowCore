import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, Bell } from 'lucide-react'
import { MainNav, type NavItem } from './MainNav'
import { UserMenu, type User } from './UserMenu'
import { AIAssistantWidget, type AIAssistantState, type SuggestedAction, type QuickAction } from './AIAssistant'
import { AIActionConfirmDialog } from './AIActionConfirmDialog'
import { AIActionProvider, useAIActionsOptional } from './AIActionContext'

export interface AppShellProps {
  children: React.ReactNode
  navigationItems: NavItem[]
  user?: User
  notificationCount?: number
  onNavigate?: (href: string) => void
  onLogout?: () => void
  onViewProfile?: () => void
  onSettings?: () => void
  onNotificationsClick?: () => void
  aiAssistantState?: AIAssistantState
  showAIAssistant?: boolean
  onAIAssistantStateChange?: (state: 'closed' | 'minimized' | 'open') => void
  onAIAssistantSendMessage?: (message: string) => Promise<void>
  onAIAssistantActionClick?: (action: SuggestedAction) => void
  onAIAssistantQuickActionClick?: (action: QuickAction) => void
}

/**
 * Inner component that renders the confirmation dialog
 * Needs to be inside AIActionProvider to use the hook
 */
function AIConfirmDialogRenderer() {
  const aiActions = useAIActionsOptional()

  if (!aiActions?.pendingAction) {
    return null
  }

  return (
    <AIActionConfirmDialog
      action={aiActions.pendingAction.action}
      onConfirm={aiActions.pendingAction.onConfirm}
      onCancel={aiActions.pendingAction.onCancel}
    />
  )
}

export function AppShell({
  children,
  navigationItems,
  user,
  notificationCount = 0,
  onNavigate,
  onLogout,
  onViewProfile,
  onSettings,
  onNotificationsClick,
  aiAssistantState,
  showAIAssistant = true,
  onAIAssistantStateChange,
  onAIAssistantSendMessage,
  onAIAssistantActionClick,
  onAIAssistantQuickActionClick,
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <AIActionProvider onNavigate={onNavigate}>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-['DM_Sans',sans-serif]">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <nav
          aria-label="Main navigation"
          className={`fixed top-0 left-0 z-50 h-full w-60 transform bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Logo */}
          <div className="relative px-4 py-4 border-b border-zinc-200 dark:border-zinc-800">
            <Link to="/" className="block">
              <img
                src="/logo/showcore-logo.png"
                alt="ShowCore"
                className="w-full h-auto dark:hidden"
              />
              <img
                src="/logo/showcore-logo-white.png"
                alt="ShowCore"
                className="w-full h-auto hidden dark:block"
              />
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden absolute top-2 right-2 p-1 rounded-md text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <MainNav
            items={navigationItems}
            onNavigate={(href) => {
              onNavigate?.(href)
              setSidebarOpen(false)
            }}
          />
        </nav>

        {/* Main content area */}
        <div className="lg:pl-60">
          {/* Header */}
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 sm:px-6">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Spacer for desktop */}
            <div className="hidden lg:block" />

            {/* Right side: notifications + user menu */}
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <button
                onClick={onNotificationsClick}
                className="relative p-2 rounded-md text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-medium text-white">
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                )}
              </button>

              {/* User menu */}
              {user && <UserMenu user={user} onLogout={onLogout} onViewProfile={onViewProfile} onSettings={onSettings} />}
            </div>
          </header>

          {/* Page content */}
          <main className="min-h-[calc(100vh-4rem)]">{children}</main>
        </div>

        {/* AI Assistant Widget */}
        {showAIAssistant && aiAssistantState && onAIAssistantStateChange && onAIAssistantSendMessage && onAIAssistantActionClick && (
          <AIAssistantWidget
            assistantState={aiAssistantState}
            onStateChange={onAIAssistantStateChange}
            onSendMessage={onAIAssistantSendMessage}
            onActionClick={onAIAssistantActionClick}
            onQuickActionClick={onAIAssistantQuickActionClick}
          />
        )}

        {/* AI Action Confirmation Dialog */}
        <AIConfirmDialogRenderer />
      </div>
    </AIActionProvider>
  )
}
