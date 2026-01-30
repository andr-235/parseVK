import { Search, SlidersHorizontal } from 'lucide-react'
import { Input } from '@/shared/ui/input'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { cn } from '@/lib/utils'

interface CommentsFiltersPanelProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  showKeywordComments: boolean
  onToggleKeywordComments: (value: boolean) => void
  showKeywordPosts: boolean
  onToggleKeywordPosts: (value: boolean) => void
  readFilter: 'all' | 'unread' | 'read'
  onReadFilterChange: (value: 'all' | 'unread' | 'read') => void
  keywordsCount: number
}

function CommentsFiltersPanel({
  searchTerm,
  onSearchChange,
  showKeywordComments,
  onToggleKeywordComments,
  showKeywordPosts,
  onToggleKeywordPosts,
  readFilter,
  onReadFilterChange,
  keywordsCount,
}: CommentsFiltersPanelProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Поиск и статистика */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Поиск по тексту, автору или ID..."
            className="pl-10 h-11 rounded-xl border-muted bg-muted/20 focus-visible:ring-1 focus-visible:ring-primary/30 transition-all hover:bg-muted/30"
          />
        </div>
      </div>

      {/* Фильтры (Pill-style) */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 mr-2 text-sm font-medium text-muted-foreground">
          <SlidersHorizontal className="h-4 w-4" />
          Фильтры:
        </div>

        {/* Статус прочтения */}
        <div className="flex items-center rounded-lg bg-muted/20 p-1 border border-border/40">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onReadFilterChange('all')}
            className={cn(
              'h-7 rounded-md px-3 text-xs font-medium transition-all',
              readFilter === 'all'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Все
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onReadFilterChange('unread')}
            className={cn(
              'h-7 rounded-md px-3 text-xs font-medium transition-all',
              readFilter === 'unread'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Непрочитанные
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onReadFilterChange('read')}
            className={cn(
              'h-7 rounded-md px-3 text-xs font-medium transition-all',
              readFilter === 'read'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Прочитанные
          </Button>
        </div>

        {/* Ключевые слова */}
        {keywordsCount > 0 && (
          <>
            <div className="w-px h-6 bg-border/50 mx-1" />
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onToggleKeywordComments(!showKeywordComments)}
                className={cn(
                  'h-9 rounded-full px-4 text-xs font-medium border transition-all',
                  showKeywordComments
                    ? 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20'
                    : 'border-border/60 bg-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                В комментариях
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onToggleKeywordPosts(!showKeywordPosts)}
                className={cn(
                  'h-9 rounded-full px-4 text-xs font-medium border transition-all',
                  showKeywordPosts
                    ? 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20'
                    : 'border-border/60 bg-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                В постах
              </Button>
            </div>
            <Badge
              variant="secondary"
              className="h-6 px-2 text-[10px] bg-muted text-muted-foreground border-0 ml-auto sm:ml-0"
            >
              Доступно {keywordsCount} ключей
            </Badge>
          </>
        )}
      </div>
    </div>
  )
}

export default CommentsFiltersPanel
