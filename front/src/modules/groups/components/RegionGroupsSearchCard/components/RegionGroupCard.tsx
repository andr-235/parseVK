import { memo } from 'react'
import type { IRegionGroupSearchItem } from '@/shared/types'
import { Button } from '@/shared/ui/button'
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
      {/* Subtle glow on selection */}
      {isSelected && (
        <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 blur-lg" />
      )}

      <div
        className={`relative flex flex-col gap-3 rounded-lg border p-4 transition-all duration-300 ${
          isSelected
            ? 'border-cyan-500/40 bg-cyan-500/5 shadow-lg shadow-cyan-500/10'
            : 'border-white/10 bg-slate-900/50 hover:border-white/20 hover:bg-slate-800/50'
        }`}
      >
        {/* Top border glow */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="flex items-start gap-3">
          {/* Custom checkbox */}
          <div className="relative mt-0.5">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelection(group.id)}
              className="peer size-4 shrink-0 cursor-pointer appearance-none rounded border border-white/20 bg-slate-800/50 transition-all duration-200 checked:border-cyan-500 checked:bg-cyan-500 focus:ring-2 focus:ring-cyan-400/20"
            />
            <svg
              className="pointer-events-none absolute left-0.5 top-0.5 size-3 text-white opacity-0 transition-opacity duration-200 peer-checked:opacity-100"
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
              className="block truncate font-monitoring-display text-sm font-medium leading-tight text-white transition-colors duration-200 hover:text-cyan-400 hover:underline"
              title={group.name}
            >
              {group.name}
            </a>
            <div className="truncate font-mono-accent text-xs text-slate-500">
              vk.com/{group.screen_name ?? `club${group.id}`}
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="-mr-2 -mt-2 size-6 text-slate-400 transition-colors duration-200 hover:bg-red-500/10 hover:text-red-400"
            onClick={() => onRemoveGroup(group.id)}
            disabled={isBulkAdding}
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Metrics */}
        <div className="flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2" title="Участники">
            <div className="flex size-6 items-center justify-center rounded-md bg-cyan-500/10 text-cyan-400">
              <UsersIcon className="size-3.5" />
            </div>
            <span className="font-mono-accent text-xs font-medium text-slate-300">
              {renderMembersCount(group)}
            </span>
          </div>
          <div className="flex items-center gap-2 truncate" title="Город">
            <MapPin className="size-3.5 shrink-0 text-slate-500" />
            <span className="truncate font-mono-accent text-xs text-slate-400">
              {formatCityTitle(group)}
            </span>
          </div>
        </div>

        {/* Add button */}
        <Button
          size="sm"
          className="group/btn relative h-8 overflow-hidden bg-gradient-to-r from-cyan-500/80 to-blue-500/80 text-xs font-semibold text-white shadow-md shadow-cyan-500/20 transition-all duration-300 hover:from-cyan-500 hover:to-blue-500 hover:shadow-lg hover:shadow-cyan-500/30"
          onClick={() => {
            void onAddGroup(group)
          }}
          disabled={isBulkAdding}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 opacity-0 transition-opacity duration-300 group-hover/btn:opacity-100" />
          <span className="relative flex items-center justify-center gap-1.5">
            <Plus className="size-3" />
            Добавить
          </span>
        </Button>
      </div>
    </div>
  )
})
