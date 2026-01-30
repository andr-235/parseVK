import { useEffect, useMemo, useState } from 'react'
import { telegramService } from '@/modules/telegram/api/telegram.api'
import type { TelegramSessionConfirmResponse } from '@/shared/types'
import toast from 'react-hot-toast'

export const useTelegramSession = () => {
  const [authTransactionId, setAuthTransactionId] = useState<string | null>(null)
  const [authStep, setAuthStep] = useState<'code' | 'success'>('success')
  const [authCode, setAuthCode] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [authNextType, setAuthNextType] = useState<'app' | 'sms' | 'call' | 'flash'>('sms')
  const [authResult, setAuthResult] = useState<TelegramSessionConfirmResponse | null>(null)

  const loadCurrentSession = async () => {
    try {
      const currentSession = await telegramService.getCurrentSession()
      if (currentSession) {
        setAuthResult(currentSession)
        setAuthStep('success')
      }
    } catch (err) {
      console.error('Failed to load current session', err)
    }
  }

  useEffect(() => {
    void loadCurrentSession()
  }, [])

  const authHint = useMemo(() => {
    switch (authNextType) {
      case 'app':
        return 'Код отправлен в приложение Telegram.'
      case 'call':
        return 'Ожидайте звонок. Код - последние цифры.'
      case 'flash':
        return 'Ожидайте flash-звонок.'
      default:
        return 'Код отправлен по SMS.'
    }
  }, [authNextType])

  const handleStartNewSession = async () => {
    setAuthLoading(true)
    setAuthError(null)
    setAuthResult(null)
    setAuthCode('')
    setAuthPassword('')
    try {
      const response = await telegramService.startSession({})
      setAuthTransactionId(response.transactionId)
      setAuthNextType(response.nextType)
      setAuthStep('code')
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Ошибка отправки кода')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleResetAuth = () => {
    setAuthTransactionId(null)
    setAuthStep('success')
    setAuthCode('')
    setAuthPassword('')
    setAuthResult(null)
    setAuthError(null)
    void loadCurrentSession()
  }

  const handleConfirmAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!authTransactionId) {
      setAuthError('Сессия не найдена')
      return
    }
    if (!authCode.trim()) {
      setAuthError('Введите код')
      return
    }
    setAuthLoading(true)
    setAuthError(null)
    try {
      const response = await telegramService.confirmSession({
        transactionId: authTransactionId,
        code: authCode.trim(),
        password: authPassword.trim() || undefined,
      })
      setAuthResult(response)
      setAuthStep('success')
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Ошибка подтверждения')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleCopySession = async () => {
    if (!authResult?.session) return
    try {
      await navigator.clipboard.writeText(authResult.session)
      toast.success('Сессия скопирована')
    } catch {
      toast.error('Ошибка копирования')
    }
  }

  return {
    authStep,
    authCode,
    setAuthCode,
    authPassword,
    setAuthPassword,
    authLoading,
    authError,
    authHint,
    authResult,
    handleStartNewSession,
    handleResetAuth,
    handleConfirmAuth,
    handleCopySession,
  }
}
