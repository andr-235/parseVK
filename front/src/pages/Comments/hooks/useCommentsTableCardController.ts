import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CategorizedComment, CategorizedGroup } from '../types/commentsTable'

interface UseCommentsTableCardControllerParams {
  groupedComments: CategorizedGroup[]
  commentsWithoutKeywords: CategorizedComment[]
  isLoading: boolean
  showOnlyKeywordComments: boolean
  hasDefinedKeywords: boolean
  totalCount: number
  loadedCount: number
  visibleCount: number
}

export default function useCommentsTableCardController({
  groupedComments,
  commentsWithoutKeywords,
  isLoading,
  showOnlyKeywordComments,
  hasDefinedKeywords,
  totalCount,
  loadedCount,
  visibleCount,
}: UseCommentsTableCardControllerParams) {
  const keywordGroups = useMemo(() => groupedComments.filter((group) => group.comments.length > 0), [groupedComments])
  const hasComments = visibleCount > 0
  const hasKeywordGroups = keywordGroups.length > 0
  const hasCommentsWithoutKeywords = commentsWithoutKeywords.length > 0
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})
  useEffect(() => {
    setExpandedCategories((previous) => {
      const next = keywordGroups.reduce<Record<string, boolean>>((acc, group) => {
        acc[group.category] = previous[group.category] ?? true
        return acc
      }, {})
      if (keywordGroups.length !== Object.keys(previous).length) return next
      for (const key of Object.keys(previous)) if (!(key in next)) return next
      return previous
    })
  }, [keywordGroups])

  const toggleCategory = useCallback(
    (category: string) =>
      setExpandedCategories((previous) => ({ ...previous, [category]: !(previous[category] ?? true) })),
    [],
  )

  const totalCategories = keywordGroups.length
  const loadedSuffix = Math.max(totalCount, loadedCount) > 0 ? ` из ${Math.max(totalCount, loadedCount)}` : ''
  const subtitle = useMemo(
    () =>
      buildSubtitle({
        isLoading,
        hasComments,
        hasKeywordGroups,
        hasCommentsWithoutKeywords,
        hasDefinedKeywords,
        showOnlyKeywordComments,
      }),
    [
      hasComments,
      hasCommentsWithoutKeywords,
      hasDefinedKeywords,
      hasKeywordGroups,
      isLoading,
      showOnlyKeywordComments,
    ],
  )
  return {
    keywordGroups,
    hasComments,
    hasKeywordGroups,
    hasCommentsWithoutKeywords,
    expandedCategories,
    toggleCategory,
    subtitle,
    loadedSuffix,
    totalCategories,
  }
}
function buildSubtitle({
  isLoading,
  hasComments,
  hasKeywordGroups,
  hasCommentsWithoutKeywords,
  hasDefinedKeywords,
  showOnlyKeywordComments,
}: {
  isLoading: boolean
  hasComments: boolean
  hasKeywordGroups: boolean
  hasCommentsWithoutKeywords: boolean
  hasDefinedKeywords: boolean
  showOnlyKeywordComments: boolean
}) {
  if (isLoading && !hasComments) return 'Мы подготавливаем данные и проверяем их перед отображением.'
  if (hasKeywordGroups) return 'Комментарии с ключевыми словами сгруппированы по категориям. Используйте фильтры, чтобы сосредоточиться на нужных темах.'
  if (hasCommentsWithoutKeywords && !hasDefinedKeywords) return 'Ключевые слова пока не заданы — все найденные комментарии находятся в разделе «Без ключевых слов».'
  if (hasComments && !showOnlyKeywordComments && hasCommentsWithoutKeywords)
    return 'Комментарии без совпадений с ключевыми словами отображаются в отдельном блоке.'
  return 'После добавления групп и запуска парсинга комментарии появятся в списке.'
}

