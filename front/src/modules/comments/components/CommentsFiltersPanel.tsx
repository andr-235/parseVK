import { memo, useCallback } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { Input } from '@/shared/ui/input'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/utils'

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

const CommentsFiltersPanel = memo(function CommentsFiltersPanel({
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
  // Memoized handlers (rerender optimization)
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onSearchChange(e.target.value)
    },
    [onSearchChange]
  )

  const handleReadFilterAll = useCallback(() => {
    onReadFilterChange('all')
  }, [onReadFilterChange])

  const handleReadFilterUnread = useCallback(() => {
    onReadFilterChange('unread')
  }, [onReadFilterChange])

  const handleReadFilterRead = useCallback(() => {
    onReadFilterChange('read')
  }, [onReadFilterChange])

  const handleToggleKeywordCommentsClick = useCallback(() => {
    onToggleKeywordComments(!showKeywordComments)
  }, [onToggleKeywordComments, showKeywordComments])

  const handleToggleKeywordPostsClick = useCallback(() => {
    onToggleKeywordPosts(!showKeywordPosts)
  }, [onToggleKeywordPosts, showKeywordPosts])

  return (
    <div className="flex flex-col gap-6">
      {/* Search input */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="group relative w-full sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400 transition-colors duration-200 group-focus-within:text-cyan-400" />
          <Input
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Поиск по тексту, автору или ID..."
            className="h-11 rounded-lg border-white/10 bg-slate-800/50 pl-10 font-monitoring-body text-white placeholder:text-slate-500 transition-all duration-200 hover:bg-slate-800/70 focus:border-cyan-400/50 focus:bg-slate-800/70 focus:ring-cyan-400/20"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="mr-2 flex items-center gap-2 font-mono-accent text-xs font-semibold uppercase tracking-wider text-slate-500">
          <SlidersHorizontal className="size-4" />
          Фильтры:
        </div>

        {/* Read status filter */}
        <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-slate-800/30 p-1 backdrop-blur-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReadFilterAll}
            className={cn(
              'h-8 rounded-md px-3 font-mono-accent text-xs font-medium transition-all duration-200',
              readFilter === 'all'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            )}
          >
            Все
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReadFilterUnread}
            className={cn(
              'h-8 rounded-md px-3 font-mono-accent text-xs font-medium transition-all duration-200',
              readFilter === 'unread'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            )}
          >
            Непрочитанные
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReadFilterRead}
            className={cn(
              'h-8 rounded-md px-3 font-mono-accent text-xs font-medium transition-all duration-200',
              readFilter === 'read'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            )}
          >
            Прочитанные
          </Button>
        </div>

        {/* Keyword filters */}
        {keywordsCount > 0 && (
          <>
            <div className="mx-1 h-6 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleKeywordCommentsClick}
                className={cn(
                  'h-9 rounded-full border px-4 font-mono-accent text-xs font-medium transition-all duration-200',
                  showKeywordComments
                    ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400 shadow-lg shadow-cyan-500/10 hover:bg-cyan-500/20'
                    : 'border-white/10 bg-transparent text-slate-400 hover:border-white/20 hover:text-white'
                )}
              >
                В комментариях
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleKeywordPostsClick}
                className={cn(
                  'h-9 rounded-full border px-4 font-mono-accent text-xs font-medium transition-all duration-200',
                  showKeywordPosts
                    ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400 shadow-lg shadow-cyan-500/10 hover:bg-cyan-500/20'
                    : 'border-white/10 bg-transparent text-slate-400 hover:border-white/20 hover:text-white'
                )}
              >
                В постах
              </Button>
            </div>
            <Badge className="ml-auto h-6 border-0 bg-slate-800/50 px-2 font-mono-accent text-[10px] text-slate-400 sm:ml-0">
              Доступно {keywordsCount} ключей
            </Badge>
          </>
        )}
      </div>
    </div>
  )
})

export default CommentsFiltersPanel
