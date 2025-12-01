import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react'
import toast from 'react-hot-toast'
import { useKeywordsStore } from '@/store'
import { keywordsService } from '@/services/keywordsService'
import type { Keyword } from '@/types'

export const useKeywordsViewModel = () => {
  const keywords = useKeywordsStore((state) => state.keywords)
  const addKeyword = useKeywordsStore((state) => state.addKeyword)
  const deleteKeyword = useKeywordsStore((state) => state.deleteKeyword)
  const loadFromFile = useKeywordsStore((state) => state.loadFromFile)
  const fetchKeywords = useKeywordsStore((state) => state.fetchKeywords)
  const isLoading = useKeywordsStore((state) => state.isLoading)

  const [keywordValue, setKeywordValue] = useState('')
  const [categoryValue, setCategoryValue] = useState('')
  const [isRecalculating, setIsRecalculating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const loadKeywords = async () => {
      try {
        await fetchKeywords()
      } catch (error) {
        console.error('Failed to fetch keywords', error)
      }
    }

    void loadKeywords()
  }, [fetchKeywords])

  const handleAddKeyword = useCallback(async () => {
    if (!keywordValue.trim()) return

    const isAdded = await addKeyword(keywordValue, categoryValue)
    if (isAdded) {
      setKeywordValue('')
      // categoryValue is intentionally left as is for easier bulk entry
    }
  }, [keywordValue, categoryValue, addKeyword])

  const handleFileUpload = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      await loadFromFile(file)
    } catch (error) {
      console.error('Failed to upload keywords from file', error)
    } finally {
      event.target.value = ''
    }
  }, [loadFromFile])

  const handleRecalculate = useCallback(async () => {
    if (isRecalculating) return

    setIsRecalculating(true)
    const toastId = toast.loading('Пересчет совпадений...')

    try {
      const result = await keywordsService.recalculateKeywordMatches()
      toast.success(
        `Обработано: ${result.processed}, обновлено: ${result.updated}, создано: ${result.created}, удалено: ${result.deleted}`,
        { id: toastId, duration: 5000 }
      )
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Ошибка при пересчете совпадений',
        { id: toastId }
      )
    } finally {
      setIsRecalculating(false)
    }
  }, [isRecalculating])

  const filteredKeywords = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    if (!normalizedSearch) return keywords

    return keywords.filter(
      (k) =>
        k.word.toLowerCase().includes(normalizedSearch) ||
        (k.category && k.category.toLowerCase().includes(normalizedSearch))
    )
  }, [keywords, searchTerm])

  return {
    keywords: filteredKeywords,
    isLoading,
    searchTerm,
    keywordValue,
    categoryValue,
    isRecalculating,
    setKeywordValue,
    setCategoryValue,
    setSearchTerm,
    handleAddKeyword,
    handleFileUpload,
    handleRecalculate,
    deleteKeyword,
  }
}

