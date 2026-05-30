import { Search, ChevronDown, ChevronRight, RotateCcw } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Spinner } from '@/shared/components/ui/spinner'

interface RegionSearchHeaderProps {
  open: boolean
  total: number
  canSearch: boolean
  isLoading: boolean
  onToggle: () => void
  onSearch: () => void
  onReset: () => void
}

export function RegionSearchHeader({
  open,
  total,
  canSearch,
  isLoading,
  onToggle,
  onSearch,
  onReset,
}: RegionSearchHeaderProps) {
  return (
    <button
      onClick={onToggle}
      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-background-sidebar/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/30 focus-visible:ring-offset-2"
    >
      <div className="flex items-center gap-2.5">
        {open ? (
          <ChevronDown className="size-4 text-text-secondary" />
        ) : (
          <ChevronRight className="size-4 text-text-secondary" />
        )}
        <Search className="size-4 text-accent-primary" />
        <span className="text-sm font-semibold text-text-light">Поиск по региону</span>
        {total > 0 && (
          <span className="rounded-md border border-border/50 bg-background-primary px-2 py-0.5 font-mono-accent text-xs text-text-secondary">
            {total}
          </span>
        )}
      </div>
      {open && (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            className="h-9 bg-accent-primary text-xs text-text-light hover:bg-accent-primary/90"
            disabled={!canSearch}
            onClick={onSearch}
          >
            {isLoading ? (
              <Spinner className="mr-1.5 size-3" />
            ) : (
              <Search className="mr-1.5 size-3" />
            )}
            Найти
          </Button>
          {total > 0 && (
            <button
              onClick={onReset}
              disabled={isLoading}
              className="flex size-9 items-center justify-center rounded-md text-text-secondary hover:bg-background-primary hover:text-text-light transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/30"
              aria-label="Сбросить поиск"
            >
              <RotateCcw className="size-3.5" />
            </button>
          )}
        </div>
      )}
    </button>
  )
}
