import { useState, useRef, useEffect } from 'react'
import { User as UserIcon, Settings, LogOut, ChevronDown } from 'lucide-react'

export interface User {
  name: string
  email?: string
  avatarUrl?: string
}

interface UserMenuProps {
  user: User
  onLogout?: () => void
  onViewProfile?: () => void
  onSettings?: () => void
}

export function UserMenu({ user, onLogout, onViewProfile, onSettings }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Get initials from name
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      >
        {/* Avatar */}
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-100 text-sm font-medium">
            {initials}
          </div>
        )}

        {/* Name (hidden on mobile) */}
        <span className="hidden sm:block text-sm font-medium text-zinc-700 dark:text-zinc-300 max-w-[120px] truncate">
          {user.name}
        </span>

        <ChevronDown className="h-4 w-4 text-zinc-400" />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg ring-1 ring-black/5 dark:ring-white/5">
          {/* User info */}
          <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
              {user.name}
            </p>
            {user.email && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                {user.email}
              </p>
            )}
          </div>

          {/* Menu items */}
          <div className="py-1">
            <button
              onClick={() => {
                onViewProfile?.()
                setIsOpen(false)
              }}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <UserIcon className="h-4 w-4" />
              View Profile
            </button>
            <button
              onClick={() => {
                onSettings?.()
                setIsOpen(false)
              }}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <Settings className="h-4 w-4" />
              Account Settings
            </button>
          </div>

          {/* Logout */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 py-1">
            <button
              onClick={() => {
                onLogout?.()
                setIsOpen(false)
              }}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
