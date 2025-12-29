import type { LucideIcon } from 'lucide-react'
import { Circle } from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon?: LucideIcon
  isActive?: boolean
  isDivider?: boolean
  isNew?: boolean
  badge?: number | string
}

interface MainNavProps {
  items: NavItem[]
  onNavigate?: (href: string) => void
}

export function MainNav({ items, onNavigate }: MainNavProps) {
  return (
    <nav className="flex flex-col gap-1 p-3">
      {items.map((item, index) => {
        if (item.isDivider) {
          return (
            <div
              key={`divider-${index}`}
              className="my-2 border-t border-zinc-200 dark:border-zinc-800"
            />
          )
        }

        const Icon = item.icon || Circle

        return (
          <button
            key={item.href || `nav-${index}`}
            onClick={() => onNavigate?.(item.href)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              item.isActive
                ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-100 border-l-2 border-amber-500 -ml-0.5 pl-[calc(0.75rem+2px)]'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
            <span className="flex-1 text-left">{item.label}</span>
            {item.isNew && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-100 text-xs font-medium">
                New
              </span>
            )}
            {item.badge !== undefined && !item.isNew && (
              <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium">
                {typeof item.badge === 'number' && item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}
