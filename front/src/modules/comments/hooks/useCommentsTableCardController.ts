import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CategorizedComment, CategorizedGroup } from '@/modules/comments/types/commentsTable'
import { filterCommentsByCategories } from '@/modules/comments/utils/filterCommentsByCategories'

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
  hasCategoryFilter,
}: {
  isLoading: boolean
  hasComments: boolean
  hasKeywordGroups: boolean
  hasCommentsWithoutKeywords: boolean
  hasDefinedKeywords: boolean
  hasAnyKeywordFilter: boolean
  hasCategoryFilter: boolean
}) => {
  if (isLoading && !hasComments) {
    return 'Мы подготавливаем данные и проверяем их перед отображением.'
  }
  if (hasKeywordGroups) {
    return hasCategoryFilter
      ? 'Показаны комментарии выбранных категорий. Можно комбинировать несколько тегов одновременно.'
      : 'Комментарии с ключевыми словами сгруппированы по категориям. Используйте фильтры, чтобы сосредоточиться на нужных темах.'
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
}

export default function useCommentsTableCardController({
  groupedComments,
  commentsWithoutKeywords,
  isLoading,
  showKeywordComments,
  showKeywordPosts,
  hasDefinedKeywords,
}: UseCommentsTableCardControllerParams) {
  // Memoized filtered groups (rerender optimization)
  const keywordGroups = useMemo(
    () => groupedComments.filter((group) => group.comments.length > 0),
    [groupedComments]
  )

  // Memoized computed values (rerender optimization)
  const totalCategories = useMemo(() => keywordGroups.length, [keywordGroups.length])
  const hasAnyKeywordFilter = useMemo(
    () => showKeywordComments || showKeywordPosts,
    [showKeywordComments, showKeywordPosts]
  )
  const availableCategories = useMemo(
    () => keywordGroups.map((group) => group.category),
    [keywordGroups]
  )
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const filteredKeywordGroups = useMemo(
    () =>
      keywordGroups
        .map((group) => ({
          ...group,
          comments: filterCommentsByCategories(group.comments, selectedCategories),
        }))
        .filter((group) => group.comments.length > 0),
    [keywordGroups, selectedCategories]
  )
  const filteredCommentsWithoutKeywords = useMemo(
    () => filterCommentsByCategories(commentsWithoutKeywords, selectedCategories),
    [commentsWithoutKeywords, selectedCategories]
  )
  const hasCategoryFilter = selectedCategories.length > 0
  const hasComments = useMemo(
    () =>
      filteredKeywordGroups.some((group) => group.comments.length > 0) ||
      filteredCommentsWithoutKeywords.length > 0,
    [filteredCommentsWithoutKeywords.length, filteredKeywordGroups]
  )

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setExpandedCategories((previous) => syncExpandedCategories(previous, filteredKeywordGroups))
  }, [filteredKeywordGroups])

  useEffect(() => {
    setSelectedCategories((current) =>
      current.filter((category) => availableCategories.includes(category))
    )
  }, [availableCategories])

  // Memoized handler (rerender optimization)
  const toggleCategory = useCallback(
    (category: string) =>
      setExpandedCategories((previous) => ({
        ...previous,
        [category]: !(previous[category] ?? true),
      })),
    []
  )
  const toggleFilterCategory = useCallback(
    (category: string) =>
      setSelectedCategories((current) =>
        current.includes(category)
          ? current.filter((item) => item !== category)
          : [...current, category]
      ),
    []
  )
  const clearCategoryFilters = useCallback(() => {
    setSelectedCategories([])
  }, [])
  const subtitle = useMemo(
    () =>
      buildSubtitle({
        isLoading,
        hasComments,
        hasKeywordGroups: filteredKeywordGroups.length > 0,
        hasCommentsWithoutKeywords: filteredCommentsWithoutKeywords.length > 0,
        hasDefinedKeywords,
        hasAnyKeywordFilter,
        hasCategoryFilter,
      }),
    [
      hasComments,
      filteredCommentsWithoutKeywords.length,
      filteredKeywordGroups.length,
      hasDefinedKeywords,
      hasCategoryFilter,
      isLoading,
      hasAnyKeywordFilter,
    ]
  )
  return {
    keywordGroups: filteredKeywordGroups,
    hasComments,
    hasKeywordGroups: filteredKeywordGroups.length > 0,
    hasCommentsWithoutKeywords: filteredCommentsWithoutKeywords.length > 0,
    expandedCategories,
    toggleCategory,
    selectedCategories,
    availableCategories,
    toggleFilterCategory,
    clearCategoryFilters,
    filteredCommentsWithoutKeywords,
    subtitle,
    totalCategories,
  }
}
