import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import PageHeroCard from '@/components/PageHeroCard'
import SectionCard from '@/components/SectionCard'
import SearchInput from '@/components/SearchInput'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useAuthorsStore } from '@/stores'
import AuthorCard from './Authors/components/AuthorCard'

function Authors() {
  const authors = useAuthorsStore((state) => state.authors)
  const total = useAuthorsStore((state) => state.total)
  const hasMore = useAuthorsStore((state) => state.hasMore)
  const isLoading = useAuthorsStore((state) => state.isLoading)
  const isLoadingMore = useAuthorsStore((state) => state.isLoadingMore)
  const isRefreshing = useAuthorsStore((state) => state.isRefreshing)
  const fetchAuthors = useAuthorsStore((state) => state.fetchAuthors)
  const loadMore = useAuthorsStore((state) => state.loadMore)
  const refreshAuthors = useAuthorsStore((state) => state.refreshAuthors)
  const storeSearch = useAuthorsStore((state) => state.search)
  const setStoreSearch = useAuthorsStore((state) => state.setSearch)

  const [searchValue, setSearchValue] = useState(storeSearch)
  const isInitialSearch = useRef(true)

  useEffect(() => {
    const load = async () => {
      try {
        await fetchAuthors({ reset: true })
      } catch (error) {
        console.error('Не удалось загрузить список авторов', error)
      }
    }

    void load()
  }, [fetchAuthors])

  useEffect(() => {
    setStoreSearch(searchValue)

    if (isInitialSearch.current) {
      isInitialSearch.current = false
      return
    }

    const timeoutId = window.setTimeout(() => {
      fetchAuthors({ search: searchValue, reset: true }).catch((error) => {
        console.error('Не удалось выполнить поиск авторов', error)
      })
    }, 400)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [searchValue, fetchAuthors, setStoreSearch])

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value)
  }, [])

  const handleLoadMore = useCallback(() => {
    loadMore().catch((error) => {
      console.error('Не удалось загрузить дополнительные карточки авторов', error)
    })
  }, [loadMore])

  const handleRefresh = useCallback(() => {
    refreshAuthors().catch((error) => {
      console.error('Не удалось обновить карточки авторов', error)
    })
  }, [refreshAuthors])

  const displayedCount = useMemo(() => authors.length, [authors])

  const heroFooter = useMemo(
    () => (
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="border-accent-primary/30 bg-accent-primary/10 text-accent-primary">
          В базе: {total}
        </Badge>
        <Badge variant="secondary" className="text-text-primary">
          Показано: {displayedCount}
        </Badge>
      </div>
    ),
    [total, displayedCount]
  )

  const showEmptyState = !isLoading && authors.length === 0

  return (
    <div className="flex flex-col gap-8">
      <PageHeroCard
        title="Авторы ВКонтакте"
        description="Карточки авторов, сохранённых после парсинга комментариев и работы мониторинга. Здесь можно быстро посмотреть ключевые данные профиля, контакты и статистику."
        footer={heroFooter}
      />

      <SectionCard
        title="Карточки авторов"
        description="Поиск поддерживает имя, фамилию, короткий адрес и числовой идентификатор VK."
        headerActions={
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="w-full sm:w-72">
              <SearchInput
                value={searchValue}
                onChange={handleSearchChange}
                placeholder="Поиск по имени, домену или ID"
              />
            </div>
            <Button
              onClick={handleRefresh}
              variant="secondary"
              disabled={isRefreshing || isLoading}
            >
              {isRefreshing ? (
                <span className="flex items-center gap-2">
                  <Spinner className="h-4 w-4" />
                  Обновление...
                </span>
              ) : (
                'Обновить'
              )}
            </Button>
          </div>
        }
        contentClassName="space-y-6"
      >
        {isLoading && authors.length === 0 ? (
          <div className="flex w-full justify-center py-10">
            <Spinner className="h-6 w-6" />
          </div>
        ) : null}

        {showEmptyState && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/60 bg-background-primary/40 px-6 py-12 text-center text-text-secondary">
            <p className="text-lg font-medium text-text-primary">Авторы не найдены</p>
            <p className="max-w-md text-sm">
              Попробуйте изменить поисковый запрос или проверьте, что парсер успел сохранить авторов из выбранных задач.
            </p>
          </div>
        )}

        {authors.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {authors.map((author) => (
              <AuthorCard key={author.id} author={author} />
            ))}
          </div>
        )}

        {hasMore && (
          <div className="flex justify-center pt-2">
            <Button onClick={handleLoadMore} disabled={isLoadingMore} variant="outline">
              {isLoadingMore ? (
                <span className="flex items-center gap-2">
                  <Spinner className="h-4 w-4" />
                  Загрузка...
                </span>
              ) : (
                'Загрузить ещё'
              )}
            </Button>
          </div>
        )}
      </SectionCard>
    </div>
  )
}

export default Authors
