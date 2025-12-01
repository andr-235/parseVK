import { useState, useMemo } from 'react'
import { useWatchlistAuthors } from '@/hooks/useWatchlistAuthors'
import { useWatchlistSettings } from '@/hooks/useWatchlistSettings'
import { useAuthorColumns } from './Watchlist/components/authorColumns'
import { useCommentColumns } from './Watchlist/components/commentColumns'
import { WatchlistTableCard } from './Watchlist/components/WatchlistTableCard'
import { WatchlistAuthorDetails } from './Watchlist/components/WatchlistAuthorDetails'
import PageTitle from '@/components/PageTitle'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Eye, EyeOff } from 'lucide-react'

function Watchlist() {
  const {
    authors,
    totalAuthors,
    hasMoreAuthors,
    isLoadingAuthors,
    isLoadingMoreAuthors,
    currentAuthor,
    isLoadingAuthorDetails,
    pendingRemoval,
    handleRefresh,
    handleLoadMore,
    handleRemoveFromWatchlist,
    handleSelectAuthor,
  } = useWatchlistAuthors()

  const {
    settings,
    isUpdatingSettings,
    handleToggleTrackAll,
  } = useWatchlistSettings()

  const [searchTerm, setSearchTerm] = useState('')

  const authorColumns = useAuthorColumns({
    handleSelectAuthor,
    handleRemoveFromWatchlist,
    pendingRemoval,
  })

  const commentColumns = useCommentColumns()

  const filteredAuthors = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    if (!normalizedSearch) return authors

    return authors.filter((item) => {
      const nameMatch = item.author.fullName.toLowerCase().includes(normalizedSearch)
      const screenNameMatch = item.author.screenName?.toLowerCase().includes(normalizedSearch)
      const vkIdMatch = String(item.authorVkId ?? '').includes(normalizedSearch)
      return Boolean(nameMatch || screenNameMatch || vkIdMatch)
    })
  }, [authors, searchTerm])

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
             <PageTitle>Авторы на карандаше</PageTitle>
             {settings && (
                <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                   Интервал: {settings.pollIntervalMinutes} мин
                </Badge>
             )}
          </div>
          <p className="max-w-2xl text-muted-foreground">
            Отслеживайте активность выбранных авторов в комментариях. 
            Система проверяет новые комментарии от этих пользователей во всех отслеживаемых группах.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
           <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh} 
              disabled={isLoadingAuthors}
              className="h-9"
           >
              <RefreshCw className={`mr-2 size-4 ${isLoadingAuthors ? 'animate-spin' : ''}`} />
              Обновить
           </Button>
           
           {settings && (
             <Button
                variant={settings.trackAllComments ? 'default' : 'outline'}
                size="sm"
                onClick={handleToggleTrackAll}
                disabled={isUpdatingSettings}
                className="h-9"
                title={settings.trackAllComments ? 'Отслеживание включено' : 'Отслеживание приостановлено'}
             >
                {settings.trackAllComments ? (
                    <>
                        <Eye className="mr-2 size-4" />
                        Отслеживание активно
                    </>
                ) : (
                    <>
                        <EyeOff className="mr-2 size-4" />
                        Отслеживание пауза
                    </>
                )}
             </Button>
           )}
        </div>
      </div>

      <WatchlistTableCard
        authors={filteredAuthors}
        totalAuthors={totalAuthors}
        hasMoreAuthors={hasMoreAuthors}
        isLoadingAuthors={isLoadingAuthors}
        isLoadingMoreAuthors={isLoadingMoreAuthors}
        authorColumns={authorColumns}
        onSelectAuthor={handleSelectAuthor}
        onLoadMore={handleLoadMore}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onRefresh={handleRefresh}
      />

      <WatchlistAuthorDetails
        currentAuthor={currentAuthor}
        isLoadingAuthorDetails={isLoadingAuthorDetails}
        commentColumns={commentColumns}
      />
    </div>
  )
}

export default Watchlist
