import { ChevronDown } from 'lucide-react'
import { cn } from '@/shared/utils'
import { getSectionButtonClasses } from './utils'
import { SidebarNavItem } from './SidebarNavItem'
import type { SidebarNavEntry, SidebarNavGroup } from './types'

interface SidebarSectionProps {
  title: string
  icon: React.ReactNode
  items: SidebarNavEntry[]
  isExpanded: boolean
  onToggle: () => void
  isCollapsed: boolean
  isActive: boolean
  collapsedLabel?: string
}

const isNavGroup = (item: SidebarNavEntry): item is SidebarNavGroup => {
  return 'items' in item
}

export function SidebarSection({
  title,
  icon,
  items,
  isExpanded,
  onToggle,
  isCollapsed,
  isActive,
  collapsedLabel,
}: SidebarSectionProps) {
  return (
    <div className="space-y-1 animate-in fade-in-0 slide-in-from-left-3 duration-700">
      {!isCollapsed && (
        <div className="px-3 mb-2 text-xs font-medium uppercase tracking-wider text-slate-500 font-mono-accent">
          {title}
        </div>
      )}

      <button
        onClick={onToggle}
        className={getSectionButtonClasses(isCollapsed, isActive)}
        title={isCollapsed ? collapsedLabel || title : undefined}
      >
        {isCollapsed ? (
          <div className="relative">
            {isActive && (
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500/30 to-blue-500/30 blur-sm" />
            )}
            <div className="relative">{icon}</div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 flex-1">
              <div className="relative">
                {isActive && (
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500/30 to-blue-500/30 blur-sm" />
                )}
                <div className="relative">{icon}</div>
              </div>
              <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                {collapsedLabel || title}
              </span>
            </div>
            <ChevronDown
              className={cn(
                'h-4 w-4 transition-all duration-300 text-slate-400',
                isExpanded && 'rotate-180 text-cyan-400'
              )}
            />
          </>
        )}
      </button>

      {!isCollapsed && isExpanded && (
        <div className="ml-4 space-y-1 mt-2 border-l border-cyan-400/20 pl-3 animate-in fade-in-0 slide-in-from-top-2 duration-500">
          {items.map((item, index) =>
            isNavGroup(item) ? (
              <div
                key={item.label}
                className="space-y-1 pt-3 first:pt-0"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="px-2 pt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 font-mono-accent">
                  {item.label}
                </div>
                <div className="ml-2 space-y-1">
                  {item.items.map((subItem, subIndex) => (
                    <div
                      key={subItem.path}
                      style={{ animationDelay: `${index * 50 + subIndex * 30}ms` }}
                    >
                      <SidebarNavItem item={subItem} />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div key={item.path} style={{ animationDelay: `${index * 50}ms` }}>
                <SidebarNavItem item={item} />
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}
