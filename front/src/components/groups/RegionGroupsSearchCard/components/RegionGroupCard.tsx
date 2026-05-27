import { memo } from 'react'
import type { IRegionGroupSearchItem } from '@/types/common'
import { Button } from '@/components/ui/button'
import { X, Plus, MapPin, Users as UsersIcon } from 'lucide-react'
import { formatCityTitle, renderMembersCount } from '../utils/groupFormatters'

interface RegionGroupCardProps {
  group: IRegionGroupSearchItem
  isSelected: boolean
  isBulkAdding: boolean
  onToggleSelection: (groupId: number) => void
  onAddGroup: (group: IRegionGroupSearchItem) => void | Promise<void>
  onRemoveGroup: (groupId: number) => void
}

export const RegionGroupCard = memo(function RegionGroupCard({
  group,
  isSelected,
  isBulkAdding,
  onToggleSelection,
  onAddGroup,
  onRemoveGroup,
}: RegionGroupCardProps) {
  return (
    <div className="group relative">
      <div
        className={`relative flex flex-col gap-3 rounded-lg border p-4 transition-all duration-300 ${
          isSelected
            ? 'border-primary bg-primary/5 shadow-soft-sm'
            : 'border-border bg-background-secondary hover:border-slate-700 hover:bg-background-sidebar/50'
        }`}
      >
        <div className="flex items-start gap-3">
          {/* Custom checkbox */}
          <div className="relative mt-0.5">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelection(group.id)}
              aria-label={`Выбрать группу ${group.name}`}
              className="peer size-4 shrink-0 cursor-pointer appearance-none rounded border border-border bg-background-primary transition-all duration-200 checked:border-primary checked:bg-primary focus:ring-2 focus:ring-primary/20"
            />
            <svg
              className="pointer-events-none absolute left-0.5 top-0.5 size-3 text-text-light opacity-0 transition-opacity duration-200 peer-checked:opacity-100"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <a
              href={`https://vk.com/${group.screen_name ?? `club${group.id}`}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block truncate font-monitoring-display text-sm font-medium leading-tight text-text-light transition-colors duration-200 hover:text-primary hover:underline"
              title={group.name}
            >
              {group.name}
            </a>
            <div className="truncate font-mono-accent text-xs text-text-secondary">
              vk.com/{group.screen_name ?? `club${group.id}`}
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="-mr-2 -mt-2 size-8 text-text-secondary transition-colors duration-200 hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onRemoveGroup(group.id)}
            disabled={isBulkAdding}
            aria-label="Удалить из списка результатов"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Metrics */}
        <div className="flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2" title="Участники">
            <div className="flex size-6 items-center justify-center rounded-md bg-background-sidebar text-text-secondary">
              <UsersIcon className="size-3.5" />
            </div>
            <span className="font-mono-accent text-xs font-medium text-text-secondary">
              {renderMembersCount(group)}
            </span>
          </div>
          <div className="flex items-center gap-2 truncate" title="Город">
            <MapPin className="size-3.5 shrink-0 text-text-secondary" />
            <span className="truncate font-mono-accent text-xs text-text-secondary">
              {formatCityTitle(group)}
            </span>
          </div>
        </div>

        {/* Add button */}
        <Button
          size="sm"
          className="w-full h-8 bg-primary font-semibold text-text-light hover:bg-primary/90 transition-all duration-200 active:translate-y-px shadow-soft-sm hover:shadow-soft-md"
          onClick={() => {
            void onAddGroup(group)
          }}
          disabled={isBulkAdding}
        >
          <span className="flex items-center justify-center gap-1.5">
            <Plus className="size-3" />
            Добавить
          </span>
        </Button>
      </div>
    </div>
  )
})
