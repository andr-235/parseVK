import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react'
import toast from 'react-hot-toast'
import { useKeywordsStore } from '@/modules/keywords/store'
// Использование services для одноразовой операции (пересчет совпадений)
// Это допустимо согласно правилам архитектуры для операций, не требующих состояния
import { keywordsService, type IKeywordFormsResponse } from '@/modules/keywords/api/keywords.api'
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
  const [phraseValue, setPhraseValue] = useState('')
  const [isRecalculating, setIsRecalculating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedKeyword, setSelectedKeyword] = useState<Keyword | null>(null)
  const [keywordForms, setKeywordForms] = useState<IKeywordFormsResponse | null>(null)
  const [isKeywordFormsLoading, setIsKeywordFormsLoading] = useState(false)
  const [manualFormValue, setManualFormValue] = useState('')
  const [exclusionValue, setExclusionValue] = useState('')

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

    const isAdded = await addKeyword(keywordValue, categoryValue, false)
    if (isAdded) {
      setKeywordValue('')
      // categoryValue is intentionally left as is for easier bulk entry
    }
  }, [keywordValue, categoryValue, addKeyword])

  const handleAddPhrase = useCallback(async () => {
    if (!phraseValue.trim()) return

    const isAdded = await addKeyword(phraseValue, categoryValue, true)
    if (isAdded) {
      setPhraseValue('')
      // categoryValue is intentionally left as is for easier bulk entry
    }
  }, [phraseValue, categoryValue, addKeyword])

  const handleFileUpload = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      try {
        await loadFromFile(file)
      } catch (error) {
        console.error('Failed to upload keywords from file', error)
      } finally {
        event.target.value = ''
      }
    },
    [loadFromFile]
  )

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
      toast.error(error instanceof Error ? error.message : 'Ошибка при пересчете совпадений', {
        id: toastId,
      })
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

  const handleManageForms = useCallback(async (keyword: Keyword) => {
    setSelectedKeyword(keyword)
    setManualFormValue('')
    setExclusionValue('')
    setIsKeywordFormsLoading(true)

    try {
      const response = await keywordsService.getKeywordForms(keyword.id)
      setKeywordForms(response)
    } catch (error) {
      console.error('Failed to load keyword forms', error)
      setKeywordForms(null)
    } finally {
      setIsKeywordFormsLoading(false)
    }
  }, [])

  const handleKeywordFormsOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setSelectedKeyword(null)
      setKeywordForms(null)
      setManualFormValue('')
      setExclusionValue('')
    }
  }, [])

  const applyFormsMutation = useCallback(
    async (
      action: (keywordId: number) => Promise<IKeywordFormsResponse>,
      onSuccess?: () => void
    ) => {
      if (!selectedKeyword) return

      setIsKeywordFormsLoading(true)
      try {
        const response = await action(selectedKeyword.id)
        setKeywordForms(response)
        onSuccess?.()
      } catch (error) {
        console.error('Failed to mutate keyword forms', error)
      } finally {
        setIsKeywordFormsLoading(false)
      }
    },
    [selectedKeyword]
  )

  const handleAddManualForm = useCallback(async () => {
    const nextValue = manualFormValue.trim()
    if (!nextValue) return

    await applyFormsMutation(
      (keywordId) => keywordsService.addManualKeywordForm(keywordId, nextValue),
      () => setManualFormValue('')
    )
  }, [applyFormsMutation, manualFormValue])

  const handleRemoveManualForm = useCallback(
    async (form: string) => {
      await applyFormsMutation((keywordId) =>
        keywordsService.removeManualKeywordForm(keywordId, form)
      )
    },
    [applyFormsMutation]
  )

  const handleAddExclusion = useCallback(async () => {
    const nextValue = exclusionValue.trim()
    if (!nextValue) return

    await applyFormsMutation(
      (keywordId) => keywordsService.addKeywordFormExclusion(keywordId, nextValue),
      () => setExclusionValue('')
    )
  }, [applyFormsMutation, exclusionValue])

  const handleRemoveExclusion = useCallback(
    async (form: string) => {
      await applyFormsMutation((keywordId) =>
        keywordsService.removeKeywordFormExclusion(keywordId, form)
      )
    },
    [applyFormsMutation]
  )

  return {
    keywords: filteredKeywords,
    isLoading,
    searchTerm,
    keywordValue,
    categoryValue,
    phraseValue,
    isRecalculating,
    selectedKeyword,
    keywordForms,
    isKeywordFormsLoading,
    manualFormValue,
    exclusionValue,
    setKeywordValue,
    setCategoryValue,
    setPhraseValue,
    setSearchTerm,
    setManualFormValue,
    setExclusionValue,
    handleAddKeyword,
    handleAddPhrase,
    handleFileUpload,
    handleRecalculate,
    handleManageForms,
    handleKeywordFormsOpenChange,
    handleAddManualForm,
    handleRemoveManualForm,
    handleAddExclusion,
    handleRemoveExclusion,
    deleteKeyword,
  }
}
