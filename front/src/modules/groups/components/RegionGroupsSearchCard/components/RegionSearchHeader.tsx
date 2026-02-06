import { Button } from '@/shared/ui/button'
import { Spinner } from '@/shared/ui/spinner'
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
    <div className="flex flex-col gap-4 border-b border-white/5 bg-slate-800/30 p-4 md:flex-row md:items-center md:justify-between md:px-6">
      <div className="space-y-1.5">
        <h2 className="font-monitoring-display text-xl font-semibold tracking-tight text-white">
          Поиск по региону
        </h2>
        <p className="text-sm text-slate-400">
          Поиск групп в регионе{' '}
          <span className="font-mono-accent text-cyan-400">«Еврейская автономная область»</span>
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          onClick={handleSearchClick}
          disabled={!canSearch}
          size="sm"
          className="group relative h-10 min-w-[140px] overflow-hidden bg-gradient-to-r from-cyan-500 to-blue-500 font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/40 hover:scale-[1.02]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <span className="relative flex items-center justify-center gap-2">
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
            className="h-10 text-slate-400 transition-colors duration-200 hover:bg-white/5 hover:text-white"
          >
            <RotateCcw className="size-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
