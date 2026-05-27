import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Search, RotateCcw } from 'lucide-react'

interface RegionSearchHeaderProps {
  total: number
  hasResults: boolean
  isLoading: boolean
  canSearch: boolean
  onSearch: () => Promise<void> | void
  onReset?: () => void
}

export const RegionSearchHeader = ({
  total,
  hasResults,
  isLoading,
  canSearch,
  onSearch,
  onReset,
}: RegionSearchHeaderProps) => {
  const handleSearchClick = async () => {
    if (!canSearch) return
    await onSearch()
  }

  const handleResetClick = () => {
    if (!isLoading) {
      onReset?.()
    }
  }

  return (
    <div className="flex flex-col gap-4 border-b border-border bg-background-sidebar/30 p-4 md:flex-row md:items-center md:justify-between md:px-6">
      <div className="space-y-1.5">
        <h2 className="font-monitoring-display text-xl font-semibold tracking-tight text-text-light">
          Поиск по региону
        </h2>
        <p className="text-sm text-text-secondary">
          Поиск групп в регионе{' '}
          <span className="font-mono-accent text-primary">«Еврейская автономная область»</span>
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          onClick={handleSearchClick}
          disabled={!canSearch}
          size="sm"
          className="h-10 min-w-[140px] bg-primary font-semibold text-text-light hover:bg-primary/90 transition-all duration-200 active:translate-y-px shadow-soft-sm hover:shadow-soft-md"
        >
          <span className="flex items-center justify-center gap-2">
            {isLoading ? <Spinner className="size-4" /> : <Search className="size-4" />}
            Найти группы
          </span>
        </Button>

        {(total > 0 || hasResults) && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={isLoading}
            onClick={handleResetClick}
            title="Очистить результаты"
            className="h-10 text-text-secondary transition-colors duration-200 hover:bg-background-primary hover:text-text-light"
          >
            <RotateCcw className="size-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
