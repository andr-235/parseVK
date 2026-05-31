import { Check, Search } from 'lucide-react'
import type { Group } from '@/shared/types'
import { cn } from '@/shared/utils'

interface CreateParseTaskModalGroupListProps {
  groups: Group[]
  selectedIds: Set<number | string>
  getDisplayName: (group: Group) => string
  onToggle: (groupId: number | string) => void
}

function CreateParseTaskModalGroupList({
  groups,
  selectedIds,
  getDisplayName,
  onToggle,
}: CreateParseTaskModalGroupListProps) {
  if (groups.length === 0) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center rounded-card border border-dashed border-border/80 bg-background-primary/35 px-6 py-10 text-center">
        <Search aria-hidden="true" className="mb-3 h-6 w-6 text-text-secondary" />
        <h3 className="font-monitoring-body text-sm font-semibold text-text-light">
          Группы не найдены
        </h3>
        <p className="mt-1 max-w-md font-monitoring-body text-sm text-text-secondary">
          Измените поисковый запрос или очистите фильтр, чтобы вернуться к полному списку.
        </p>
      </div>
    )
  }

  return (
    <div className="max-h-[52vh] overflow-y-auto pr-1">
      <div className="grid gap-2">
        {groups.map((group) => {
          const displayName = getDisplayName(group)
          const isChecked = selectedIds.has(group.vkId)

          return (
            <button
              key={group.vkId}
              type="button"
              role="checkbox"
              aria-checked={isChecked}
              onClick={() => onToggle(group.vkId)}
              className={cn(
                'group flex min-h-16 w-full items-center gap-4 rounded-card border p-3 text-left outline-none hover:border-accent-primary/35 hover:bg-background-primary/60 focus-visible:ring-2 focus-visible:ring-accent-primary/30',
                isChecked
                  ? 'border-accent-primary/50 bg-accent-primary/10'
                  : 'border-border/70 bg-background-primary/35'
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded border',
                  isChecked
                    ? 'border-accent-primary bg-accent-primary text-primary-foreground'
                    : 'border-border/80 bg-background-secondary text-transparent group-hover:border-accent-primary/60'
                )}
              >
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </span>
              <span className="min-w-0">
                <span className="block truncate font-monitoring-body text-sm font-semibold text-text-light">
                  {displayName}
                </span>
                {group.vkId ? (
                  <span className="mt-1 block font-mono-accent text-xs text-text-secondary">
                    vk.com/club{group.vkId}
                  </span>
                ) : null}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default CreateParseTaskModalGroupList
