import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CategorizedComment, CategorizedGroup } from '@/modules/comments/types/commentsTable'

const syncExpandedCategories = (previous: Record<string, boolean>, groups: CategorizedGroup[]) => {
  const next = groups.reduce<Record<string, boolean>>((acc, group) => {
    acc[group.category] = previous[group.category] ?? true
    return acc
  }, {})

  if (groups.length !== Object.keys(previous).length) return next
  for (const key of Object.keys(previous)) {
    if (!(key in next)) return next
  }
  return previous
}

const buildSubtitle = ({
  isLoading,
  hasComments,
  hasKeywordGroups,
  hasCommentsWithoutKeywords,
  hasDefinedKeywords,
  hasAnyKeywordFilter,
}: {
  isLoading: boolean
  hasComments: boolean
  hasKeywordGroups: boolean
  hasCommentsWithoutKeywords: boolean
  hasDefinedKeywords: boolean
  hasAnyKeywordFilter: boolean
}) => {
  if (isLoading && !hasComments) {
    return 'Мы подготавливаем данные и проверяем их перед отображением.'
  }
  if (hasKeywordGroups) {
    return 'Комментарии с ключевыми словами сгруппированы по категориям. Используйте фильтры, чтобы сосредоточиться на нужных темах.'
  }
  if (hasCommentsWithoutKeywords && !hasDefinedKeywords) {
    return 'Ключевые слова пока не заданы — все найденные комментарии находятся в разделе «Без ключевых слов».'
  }
  if (hasComments && !hasAnyKeywordFilter && hasCommentsWithoutKeywords) {
    return 'Комментарии без совпадений с ключевыми словами отображаются в отдельном блоке.'
  }
  return 'После добавления групп и запуска парсинга комментарии появятся в списке.'
}

interface UseCommentsTableCardControllerParams {
  groupedComments: CategorizedGroup[]
  commentsWithoutKeywords: CategorizedComment[]
  isLoading: boolean
  showKeywordComments: boolean
  showKeywordPosts: boolean
  hasDefinedKeywords: boolean
  visibleCount: number
}

export default function useCommentsTableCardController({
  groupedComments,
  commentsWithoutKeywords,
  isLoading,
  showKeywordComments,
  showKeywordPosts,
  hasDefinedKeywords,
  visibleCount,
}: UseCommentsTableCardControllerParams) {
  // Memoized filtered groups (rerender optimization)
  const keywordGroups = useMemo(
    () => groupedComments.filter((group) => group.comments.length > 0),
    [groupedComments]
  )

  // Memoized computed values (rerender optimization)
  const hasComments = useMemo(() => visibleCount > 0, [visibleCount])
  const hasKeywordGroups = useMemo(() => keywordGroups.length > 0, [keywordGroups.length])
  const hasCommentsWithoutKeywords = useMemo(
    () => commentsWithoutKeywords.length > 0,
    [commentsWithoutKeywords.length]
  )
  const totalCategories = useMemo(() => keywordGroups.length, [keywordGroups.length])
  const hasAnyKeywordFilter = useMemo(
    () => showKeywordComments || showKeywordPosts,
    [showKeywordComments, showKeywordPosts]
  )

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setExpandedCategories((previous) => syncExpandedCategories(previous, keywordGroups))
  }, [keywordGroups])

  // Memoized handler (rerender optimization)
  const toggleCategory = useCallback(
    (category: string) =>
      setExpandedCategories((previous) => ({
        ...previous,
        [category]: !(previous[category] ?? true),
      })),
    []
  )
  const subtitle = useMemo(
    () =>
      buildSubtitle({
        isLoading,
        hasComments,
        hasKeywordGroups,
        hasCommentsWithoutKeywords,
        hasDefinedKeywords,
        hasAnyKeywordFilter,
      }),
    [
      hasComments,
      hasCommentsWithoutKeywords,
      hasDefinedKeywords,
      hasKeywordGroups,
      isLoading,
      hasAnyKeywordFilter,
    ]
  )
  return {
    keywordGroups,
    hasComments,
    hasKeywordGroups,
    hasCommentsWithoutKeywords,
    expandedCategories,
    toggleCategory,
    subtitle,
    totalCategories,
  }
}
