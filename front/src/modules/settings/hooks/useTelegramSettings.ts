import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
// Использование services для одноразовых операций (загрузка/сохранение настроек Telegram)
// Это допустимо согласно правилам архитектуры для операций, не требующих глобального состояния
import { telegramService } from '@/modules/telegram/api/telegram.api'
import type { TelegramSettingsRequest } from '@/types/api'

interface TelegramFormState {
  phoneNumber: string
  apiId: string
  apiHash: string
}

export const useTelegramSettings = () => {
  const [formState, setFormState] = useState<TelegramFormState>({
    phoneNumber: '',
    apiId: '',
    apiHash: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true)
      try {
        const saved = await telegramService.getSettings()
        if (saved) {
          setFormState({
            phoneNumber: saved.phoneNumber ?? '',
            apiId: saved.apiId ? String(saved.apiId) : '',
            apiHash: saved.apiHash ?? '',
          })
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('Failed to load Telegram settings', err)
        }
      } finally {
        setIsLoading(false)
      }
    }
    void loadSettings()
  }, [])

  const handlePhoneChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setFormState((prev) => ({
      ...prev,
      phoneNumber: event.target.value,
    }))
  }, [])

  const handleApiIdChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setFormState((prev) => ({
      ...prev,
      apiId: event.target.value,
    }))
  }, [])

  const handleApiHashChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setFormState((prev) => ({
      ...prev,
      apiHash: event.target.value,
    }))
  }, [])

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      setIsSaving(true)
      try {
        const payload: TelegramSettingsRequest = {
          phoneNumber: formState.phoneNumber.trim() || null,
          apiId: formState.apiId.trim() ? Number.parseInt(formState.apiId.trim(), 10) : null,
          apiHash: formState.apiHash.trim() || null,
        }
        await telegramService.updateSettings(payload)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Не удалось сохранить настройки')
      } finally {
        setIsSaving(false)
      }
    },
    [formState]
  )

  return {
    formState,
    isLoading,
    isSaving,
    handlePhoneChange,
    handleApiIdChange,
    handleApiHashChange,
    handleSubmit,
  }
}
