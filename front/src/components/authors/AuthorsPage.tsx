import { PageHeader } from '@/components/common'
import { useAuthorsViewModel } from '@/hooks/authors/useAuthorsViewModel'
import { Users, Shield, Microscope, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/common'
import { AuthorsFiltersPanel } from '@/components/authors/AuthorsFiltersPanel'
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
          cards={[
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
            {
              icon: Shield,
              title: 'Проверка',
              subtitle: 'Управление статусами верификации',
              bgGradientClass: 'from-accent-primary/20 to-accent-info/20',
              borderGradientClass: 'via-accent-primary/50',
              iconBgClass: 'bg-accent-primary/10',
              iconTextClass: 'text-accent-primary',
            },
            {
              icon: Microscope,
              title: 'Анализ фото',
              subtitle: 'AI-анализ изображений профилей',
              bgGradientClass: 'from-accent-info/20 to-accent-primary/20',
              borderGradientClass: 'via-accent-info/50',
              iconBgClass: 'bg-accent-info/10',
              iconTextClass: 'text-accent-info',
            },
            {
              icon: Users,
              title: 'Профили',
              subtitle: 'Детальная информация и активность',
              bgGradientClass: 'from-accent-primary/20 to-accent-info/20',
              borderGradientClass: 'via-accent-primary/50',
              iconBgClass: 'bg-accent-primary/10',
              iconTextClass: 'text-accent-primary',
            },
          ]}
        />
      </div>

      {/* Filters Panel - staggered animation */}
      <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-100">
        <div className="flex items-center gap-4">
          <h2 className="font-monitoring-display text-2xl font-semibold text-white">Фильтры</h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        </div>

        <AuthorsFiltersPanel
          searchTerm={searchValue}
          onSearchChange={handleSearchChange}
          statusFilter={statusFilter}
          onStatusFilterChange={handleStatusFilterChange}
          cityFilter={cityValue}
          onCityFilterChange={handleCityFilterChange}
          cityOptions={cityOptions}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing || isLoading}
        />
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
