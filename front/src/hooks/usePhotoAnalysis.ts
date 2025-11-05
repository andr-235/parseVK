import { useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { usePhotoAnalysisStore } from '@/stores'
import type { AnalyzePhotosOptions } from '@/types'
import { calculateAnalysisParams } from '@/utils/authorAnalysisUtils'
import type { AuthorDetails } from '@/types'

/**
 * Кастомный хук для управления анализом фотографий
 * Использует селекторы Zustand для оптимизации рендеров
 */
export const usePhotoAnalysis = (vkUserId: number, isValidAuthor: boolean, author: AuthorDetails | null) => {
  // Используем селекторы для подписки только на нужные поля
  const analyses = usePhotoAnalysisStore((state) => state.analyses)
  const summary = usePhotoAnalysisStore((state) => state.summary)
  const isLoading = usePhotoAnalysisStore((state) => state.isLoading)
  const isAnalyzing = usePhotoAnalysisStore((state) => state.isAnalyzing)
  const filter = usePhotoAnalysisStore((state) => state.filter)

  const analyzeAuthor = usePhotoAnalysisStore((state) => state.analyzeAuthor)
  const fetchResults = usePhotoAnalysisStore((state) => state.fetchResults)
  const fetchSuspicious = usePhotoAnalysisStore((state) => state.fetchSuspicious)
  const deleteResults = usePhotoAnalysisStore((state) => state.deleteResults)
  const setFilter = usePhotoAnalysisStore((state) => state.setFilter)
  const clear = usePhotoAnalysisStore((state) => state.clear)

  // Загрузка результатов анализа при изменении фильтра
  useEffect(() => {
    if (!isValidAuthor) {
      return
    }

    const load = async () => {
      try {
        if (filter === 'suspicious') {
          await fetchSuspicious(vkUserId)
        } else {
          await fetchResults(vkUserId)
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Не удалось загрузить результаты анализа'
        toast.error(message)
      }
    }

    void load()
  }, [fetchResults, fetchSuspicious, filter, isValidAuthor, vkUserId])

  // Очистка состояния при размонтировании
  useEffect(() => () => {
    clear()
  }, [clear])

  // Анализ фотографий с поддержкой пакетной обработки
  const handleAnalyze = useCallback(async (force = false) => {
    if (!isValidAuthor || !author) {
      return
    }

    const { totalPhotos, maxBatches, batchSize } = calculateAnalysisParams(author.photosCount)
    let offset = 0
    let batchesAttempted = 0
    let previousAnalyzed = summary?.total ?? 0

    try {
      while (batchesAttempted < maxBatches) {
        const remaining = totalPhotos - offset

        if (remaining <= 0 && batchesAttempted > 0) {
          break
        }

        const batchLimit = Math.max(
          Math.min(remaining > 0 ? remaining : batchSize, batchSize),
          1,
        )

        const options: AnalyzePhotosOptions = {
          limit: batchLimit,
          offset,
          force,
        }

        const response = await analyzeAuthor(vkUserId, options)
        batchesAttempted += 1

        const newAnalyzedTotal = response.analyzedCount
        const processedInBatch = newAnalyzedTotal - previousAnalyzed
        previousAnalyzed = newAnalyzedTotal

        offset += batchLimit

        if (processedInBatch <= 0) {
          if (offset < totalPhotos) {
            continue
          }
          break
        }

        if (offset >= totalPhotos) {
          break
        }
      }

      toast.success(force ? 'Повторный анализ завершён' : 'Анализ фотографий выполнен')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось проанализировать фотографии'
      toast.error(message)
    }
  }, [isValidAuthor, author, summary?.total, analyzeAuthor, vkUserId])

  // Удаление результатов анализа
  const handleDelete = useCallback(async () => {
    if (!isValidAuthor) {
      return
    }

    try {
      await deleteResults(vkUserId)
      toast.success('Результаты анализа удалены')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось удалить результаты анализа'
      toast.error(message)
    }
  }, [isValidAuthor, deleteResults, vkUserId])

  // Изменение фильтра
  const handleFilterChange = useCallback((nextFilter: 'all' | 'suspicious') => {
    if (filter === nextFilter || !isValidAuthor) {
      return
    }

    setFilter(nextFilter)
  }, [filter, isValidAuthor, setFilter])

  return {
    // Состояние
    analyses,
    summary,
    isLoading,
    isAnalyzing,
    filter,

    // Действия
    handleAnalyze,
    handleDelete,
    handleFilterChange,
  }
}