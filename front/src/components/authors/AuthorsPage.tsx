import { PageHeader, FiltersPanel } from '@/components/common'
import { useAuthorsViewModel } from '@/hooks/authors/useAuthorsViewModel'
import { Users, Shield, Microscope, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/utils/common'
import { AuthorsTableCard } from '@/components/authors/AuthorsTableCard'

function AuthorsPage() {
  const {
    authors,
    hasMore,
    isLoading,
    isLoadingMore,
    isRefreshing,
    searchValue,
    statusFilter,
    cityValue,
    cityOptions,
    sortBy,
    sortOrder,
    analyzingVkUserId,
    isAnalyzing,
    emptyTitle,
    emptyDescription,
    handleSearchChange,
    handleStatusFilterChange,
    handleCityFilterChange,
    handleLoadMore,
    handleRefresh,
    handleOpenDetails,
    handleAnalyzePhotos,
    handleDeleteAuthor,
    deletingVkUserId,
    handleVerifyAuthor,
    handleSortChange,
  } = useAuthorsViewModel()

  const pageCards = [
    {
      icon: Users,
      title: 'Всего авторов',
      subtitle: '',
      customContent: (
        <div className="space-y-1">
          <p className="text-xs text-text-secondary font-medium uppercase tracking-wide font-mono-accent">
            Всего авторов
          </p>
          <p className="font-monitoring-display text-2xl font-bold text-text-light">
            {authors.length.toLocaleString('ru-RU')}
          </p>
        </div>
      ),
    },
    { icon: Shield, title: 'Проверка', subtitle: 'Управление статусами верификации' },
    { icon: Microscope, title: 'Анализ фото', subtitle: 'AI-анализ изображений профилей' },
    { icon: Users, title: 'Профили', subtitle: 'Детальная информация и активность' },
  ]

  return (
    <div className="flex flex-col gap-10 max-w-[1600px] mx-auto w-full px-4 md:px-8 py-6 font-monitoring-body">
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
        <PageHeader
          variant="grid"
          title={
            <>
              Авторы <span className="text-accent-primary">ВКонтакте</span>
            </>
          }
          description="База авторов, собранная через парсинг и мониторинг. Управляйте статусами проверки и анализируйте профили для выявления подозрительной активности."
          actions={
            <Button
              onClick={handleRefresh}
              size="lg"
              variant="outline"
              className="h-11 shrink-0 border-border bg-background-secondary text-text-primary hover:bg-background-primary hover:border-accent-primary/50 transition-all duration-200"
              disabled={isRefreshing}
            >
              <RefreshCw className={cn('mr-2 w-5 h-5', isRefreshing && 'animate-spin')} />
              Обновить
            </Button>
          }
          cards={pageCards}
        />
      </div>

      {/* Filters Panel - staggered animation */}
      <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-100">
        <div className="flex items-center gap-4">
          <h2 className="font-monitoring-display text-2xl font-semibold text-white">Фильтры</h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        </div>

        <FiltersPanel
          searchTerm={searchValue}
          onSearchChange={handleSearchChange}
          searchPlaceholder="Поиск по имени, домену или ID..."
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing || isLoading}
        >
          <div className="flex items-center rounded-lg bg-background-primary p-1 border border-border">
            {(['all', 'verified', 'unverified'] as const).map((filter) => (
              <Button
                key={filter}
                variant="ghost"
                size="sm"
                onClick={() => handleStatusFilterChange(filter)}
                className={cn(
                  'h-7 rounded-md px-3 text-xs font-medium transition-all',
                  statusFilter === filter
                    ? 'bg-background-secondary shadow-sm text-text-light'
                    : 'text-text-secondary hover:text-text-light'
                )}
              >
                {filter === 'all' ? 'Все' : filter === 'verified' ? 'Проверенные' : 'Непроверенные'}
              </Button>
            ))}
          </div>

          <div className="flex min-w-[220px] flex-1 items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-mono-accent">Город</span>
            <Input
              value={cityValue}
              onChange={(event) => handleCityFilterChange(event.target.value)}
              placeholder="Любой"
              list="authors-city-options"
              className="h-9 rounded-lg border-border bg-background-primary text-sm focus-visible:ring-1 focus-visible:ring-accent-primary/30"
            />
            <datalist id="authors-city-options">
              {cityOptions.map((city) => (
                <option key={city} value={city} />
              ))}
            </datalist>
          </div>
        </FiltersPanel>
      </div>

      {/* Authors Table - staggered animation */}
      <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-200">
        <div className="flex items-center gap-4">
          <h2 className="font-monitoring-display text-2xl font-semibold text-white">
            База авторов
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        </div>

        <AuthorsTableCard
          authors={authors}
          isLoading={isLoading}
          sortBy={sortBy ?? 'fullName'}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
          onOpenDetails={handleOpenDetails}
          onAnalyzePhotos={handleAnalyzePhotos}
          onDeleteAuthor={handleDeleteAuthor}
          onVerifyAuthor={handleVerifyAuthor}
          deletingVkUserId={deletingVkUserId}
          analyzingVkUserId={analyzingVkUserId}
          isAnalyzing={isAnalyzing}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          onLoadMore={handleLoadMore}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
        />
      </div>
    </div>
  )
}

export default AuthorsPage
