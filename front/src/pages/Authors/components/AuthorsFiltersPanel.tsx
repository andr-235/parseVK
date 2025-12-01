import { Search, SlidersHorizontal, RefreshCw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AuthorsFiltersPanelProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  statusFilter: 'unverified' | 'verified' | 'all'
  onStatusFilterChange: (value: 'unverified' | 'verified' | 'all') => void
  onRefresh: () => void
  isRefreshing: boolean
}

export function AuthorsFiltersPanel({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onRefresh,
  isRefreshing
}: AuthorsFiltersPanelProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md group">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
           <Input
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Поиск по имени, домену или ID..."
              className="pl-10 h-11 rounded-xl border-muted bg-muted/20 focus-visible:ring-1 focus-visible:ring-primary/30 transition-all hover:bg-muted/30"
           />
        </div>
         <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-11 w-11 shrink-0 rounded-xl border-muted bg-background hover:bg-muted/50"
            title="Обновить список"
        >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 mr-2 text-sm font-medium text-muted-foreground">
             <SlidersHorizontal className="h-4 w-4" />
             Фильтры:
          </div>

          <div className="flex items-center rounded-lg bg-muted/20 p-1 border border-border/40">
             {(['all', 'verified', 'unverified'] as const).map((filter) => (
                <Button
                    key={filter}
                    variant="ghost"
                    size="sm"
                    onClick={() => onStatusFilterChange(filter)}
                    className={cn(
                        "h-7 rounded-md px-3 text-xs font-medium transition-all",
                        statusFilter === filter
                            ? "bg-background shadow-sm text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    {filter === 'all' ? 'Все' : filter === 'verified' ? 'Проверенные' : 'Непроверенные'}
                </Button>
             ))}
          </div>
      </div>
    </div>
  )
}

