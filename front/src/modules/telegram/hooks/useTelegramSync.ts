import { useState } from 'react'
import { telegramService } from '@/services/telegramService'
import type { TelegramSyncResponse } from '@/types/api'
import toast from 'react-hot-toast'

export const useTelegramSync = (onDataLoaded: (data: TelegramSyncResponse) => void) => {
  const [identifier, setIdentifier] = useState('')
  const [limit, setLimit] = useState<string>('1000')
  const [loading, setLoading] = useState(false)
  const [lastSyncData, setLastSyncData] = useState<TelegramSyncResponse | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!identifier.trim()) {
      toast.error('Укажите идентификатор чата')
      return
    }
    setLoading(true)
    try {
      const numericLimit = Number.parseInt(limit, 10)
      const response = await telegramService.syncChat({
        identifier: identifier.trim(),
        limit: Number.isNaN(numericLimit) ? undefined : numericLimit,
      })
      setLastSyncData(response)
      onDataLoaded(response)
      toast.success('Участники успешно загружены')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка загрузки участников')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    if (!lastSyncData?.chatId) return
    const url = `${import.meta.env.VITE_API_URL || '/api'}/telegram/export/${lastSyncData.chatId}`
    window.open(url, '_blank')
  }

  return {
    identifier,
    setIdentifier,
    limit,
    setLimit,
    loading,
    lastSyncData,
    handleSubmit,
    handleExport,
  }
}
