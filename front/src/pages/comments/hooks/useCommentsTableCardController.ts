import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CategorizedComment, CategorizedGroup } from '@/pages/comments/types/commentsTable'

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

interface UseCommentsTableCardControllerParams {
  groupedComments: CategorizedGroup[]
  commentsWithoutKeywords: CategorizedComment[]
}

export default function useCommentsTableCardController({
  groupedComments,
  commentsWithoutKeywords,
}: UseCommentsTableCardControllerParams) {
  const keywordGroups = useMemo(
    () => groupedComments.filter((group) => group.comments.length > 0),
    [groupedComments]
  )

  const availableCategories = useMemo(
    () => keywordGroups.map((group) => group.category),
    [keywordGroups]
  )

  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const activeCategoryIndex = activeCategory !== null ? availableCategories.indexOf(activeCategory) : -1
  const activeCategoryValid = activeCategory === null || activeCategoryIndex >= 0
  const safeActiveCategory = activeCategoryValid ? activeCategory : null

  useEffect(() => {
    if (!activeCategoryValid) {
      setActiveCategory(null)
    }
  }, [activeCategoryValid])

  const filteredKeywordGroups = useMemo(
    () =>
      safeActiveCategory === null
        ? keywordGroups
        : keywordGroups
            .map((group) => ({
              ...group,
              comments:
                group.category === safeActiveCategory
                  ? group.comments
                  : [],
            }))
            .filter((group) => group.comments.length > 0),
    [keywordGroups, safeActiveCategory]
  )

  const filteredCommentsWithoutKeywords = useMemo(
    () =>
      safeActiveCategory === null
        ? commentsWithoutKeywords
        : [],
    [commentsWithoutKeywords, safeActiveCategory]
  )

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

  const toggleCategory = useCallback(
    (category: string) =>
      setExpandedCategories((previous) => ({
        ...previous,
        [category]: !(previous[category] ?? true),
      })),
    []
  )

  const selectCategory = useCallback((category: string | null) => {
    setActiveCategory(category)
  }, [])

  return {
    keywordGroups: filteredKeywordGroups,
    hasComments,
    hasKeywordGroups: filteredKeywordGroups.length > 0,
    hasCommentsWithoutKeywords: filteredCommentsWithoutKeywords.length > 0,
    expandedCategories,
    toggleCategory,
    activeCategory: safeActiveCategory,
    availableCategories,
    selectCategory,
    filteredCommentsWithoutKeywords,
  }
}
