import { memo } from 'react'
import { Plus, X, Users, MapPin } from 'lucide-react'
import type { IRegionGroupSearchItem } from '@/shared/types'
import { Button } from '@/shared/components/ui/button'
import { formatCity, formatMembers, vkLink } from '../utils/regionSearchHelpers'

interface RegionGroupRowProps {
  group: IRegionGroupSearchItem
  selected: boolean
  onToggle: (id: number) => void
  onAdd: (group: IRegionGroupSearchItem) => void
  onRemove: (id: number) => void
  disabled: boolean
}

export const RegionGroupRow = memo(function RegionGroupRow({
  group,
  selected,
  onToggle,
  onAdd,
  onRemove,
  disabled,
}: RegionGroupRowProps) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg border px-3.5 py-2.5 transition-colors duration-150 ${
        selected
          ? 'border-accent-primary/40 bg-accent-primary/5'
          : 'border-border/50 bg-background-secondary hover:border-border'
      }`}
    >
      <div className="relative flex items-center">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggle(group.id)}
          aria-label={`Выбрать ${group.name}`}
          className="peer size-4 cursor-pointer appearance-none rounded border border-border/60 bg-background-primary transition-colors checked:border-accent-primary checked:bg-accent-primary focus:ring-2 focus:ring-accent-primary/20"
        />
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute left-0.5 top-0.5 size-3 text-text-light opacity-0 transition-opacity peer-checked:opacity-100"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <a
        href={vkLink(group)}
        target="_blank"
        rel="noopener noreferrer"
        className="min-w-0 flex-1 truncate text-sm font-medium text-text-light transition-colors hover:text-accent-primary hover:underline"
        title={group.name}
      >
        {group.name}
      </a>

      <div className="hidden items-center gap-3 text-xs text-text-secondary sm:flex">
        <span className="flex items-center gap-1">
          <Users className="size-3" />
          {formatMembers(group)}
        </span>
        <span className="flex items-center gap-1">
          <MapPin className="size-3" />
          {formatCity(group)}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <Button
          size="sm"
          className="h-9 px-3 text-xs bg-accent-primary text-text-light hover:bg-accent-primary/90"
          onClick={() => onAdd(group)}
          disabled={disabled}
        >
          <Plus className="mr-1 size-3" />
          Добавить
        </Button>
        <button
          onClick={() => onRemove(group.id)}
          disabled={disabled}
          className="flex size-9 items-center justify-center rounded-md text-text-secondary hover:bg-destructive/10 hover:text-accent-danger transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/30"
          aria-label={`Удалить ${group.name} из результатов`}
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  )
})
