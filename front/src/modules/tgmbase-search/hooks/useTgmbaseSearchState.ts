import { useState } from 'react'
import { tgmbaseSearchService } from '@/modules/tgmbase-search/api/tgmbaseSearch.api'
import { useTgmbaseSearch } from '@/modules/tgmbase-search/hooks/useTgmbaseSearch'
import type { TgmbaseSearchItem, TgmbaseSearchResponse } from '@/shared/types'

const DEFAULT_PAGE_SIZE = 20

const parseQueries = (value: string): string[] =>
  value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)

export function useTgmbaseSearchState() {
  const [input, setInput] = useState('')
  const [result, setResult] = useState<TgmbaseSearchResponse | null>(null)
  const [selectedQuery, setSelectedQuery] = useState<string | null>(null)
  const [loadingMoreQuery, setLoadingMoreQuery] = useState<string | null>(null)
  const searchMutation = useTgmbaseSearch()

  const submit = async (queries = parseQueries(input)) => {
    if (queries.length === 0) {
      return
    }

    const nextResult = await searchMutation.mutateAsync({
      queries,
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
    })

    setResult(nextResult)
    setSelectedQuery(nextResult.items[0]?.query ?? null)
  }

  const selectQuery = (query: string) => {
    setSelectedQuery(query)
  }

  const loadMoreMessages = async (item: TgmbaseSearchItem) => {
    if (loadingMoreQuery || !item.messagesPage.hasMore) {
      return
    }

    setLoadingMoreQuery(item.query)

    try {
      const nextPage = item.messagesPage.page + 1
      const response = await tgmbaseSearchService.search({
        queries: [item.query],
        page: nextPage,
        pageSize: item.messagesPage.pageSize,
      })

      const nextItem = response.items[0]
      if (!nextItem) {
        return
      }

      setResult((current) => {
        if (!current) {
          return current
        }

        return {
          ...current,
          items: current.items.map((currentItem) => {
            if (currentItem.query !== item.query) {
              return currentItem
            }

            return {
              ...nextItem,
              messagesPage: {
                ...nextItem.messagesPage,
                items: [
                  ...currentItem.messagesPage.items,
                  ...nextItem.messagesPage.items.filter(
                    (message) =>
                      !currentItem.messagesPage.items.some(
                        (existing) => existing.id === message.id
                      )
                  ),
                ],
              },
            }
          }),
        }
      })
    } finally {
      setLoadingMoreQuery(null)
    }
  }

  return {
    input,
    setInput,
    result,
    selectedQuery,
    isLoading: searchMutation.isPending,
    loadingMoreQuery,
    submit,
    selectQuery,
    loadMoreMessages,
  }
}
