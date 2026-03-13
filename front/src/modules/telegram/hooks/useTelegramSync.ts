import { useState } from 'react'
import { telegramService } from '@/modules/telegram/api/telegram.api'
import type { TelegramSyncResult } from '@/shared/types'
import toast from 'react-hot-toast'

export const useTelegramSync = (onDataLoaded: (data: TelegramSyncResult) => void) => {
  const [identifier, setIdentifier] = useState('')
  const [syncMode, setSyncMode] = useState<'members' | 'commentAuthors'>('members')
  const [discussionMode, setDiscussionMode] = useState<'thread' | 'chatRange'>('thread')
  const [limit, setLimit] = useState<string>('1000')
  const [messageId, setMessageId] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [messageLimit, setMessageLimit] = useState('200')
  const [authorLimit, setAuthorLimit] = useState('1000')
  const [loading, setLoading] = useState(false)
  const [lastSyncData, setLastSyncData] = useState<TelegramSyncResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!identifier.trim()) {
      toast.error('Укажите идентификатор чата')
      return
    }

    setErrorMessage(null)
    setLoading(true)
    try {
      const response =
        syncMode === 'members'
          ? await telegramService.syncChat({
              identifier: identifier.trim(),
              limit: parseOptionalNumber(limit),
            })
          : await telegramService.syncDiscussionAuthors({
              identifier: identifier.trim(),
              mode: discussionMode,
              messageId: parseOptionalNumber(messageId),
              dateFrom: dateFrom || undefined,
              dateTo: dateTo || undefined,
              messageLimit: parseOptionalNumber(messageLimit),
              authorLimit: parseOptionalNumber(authorLimit),
            })

      setLastSyncData(response)
      onDataLoaded(response)
      toast.success(
        syncMode === 'members'
          ? 'Участники успешно загружены'
          : 'Авторы комментариев успешно загружены'
      )
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : syncMode === 'members'
            ? 'Ошибка загрузки участников'
            : 'Ошибка загрузки авторов комментариев'
      setErrorMessage(message)
      toast.error(message)
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
    syncMode,
    setSyncMode,
    discussionMode,
    setDiscussionMode,
    limit,
    setLimit,
    messageId,
    setMessageId,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    messageLimit,
    setMessageLimit,
    authorLimit,
    setAuthorLimit,
    loading,
    lastSyncData,
    errorMessage,
    handleSubmit,
    handleExport,
  }
}

function parseOptionalNumber(value: string): number | undefined {
  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) ? undefined : parsed
}
