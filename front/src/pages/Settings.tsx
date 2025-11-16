import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import PageHeroCard from '../components/PageHeroCard'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { useTaskAutomationStore } from '../stores'
import { clamp, formatAutomationDate, formatAutomationTime } from '../utils/automationFormatting'
import { telegramApi } from '../api/telegramApi'
import type { TelegramSettingsRequest } from '../types/api'
import toast from 'react-hot-toast'

interface AutomationFormState {
  enabled: boolean
  time: string
  postLimit: number
}

const DEFAULT_TIME = '03:00'
const MIN_POST_LIMIT = 1
const MAX_POST_LIMIT = 100

function Settings() {
  const settings = useTaskAutomationStore((state) => state.settings)
  const fetchSettings = useTaskAutomationStore((state) => state.fetchSettings)
  const updateSettings = useTaskAutomationStore((state) => state.updateSettings)
  const runNow = useTaskAutomationStore((state) => state.runNow)
  const isLoading = useTaskAutomationStore((state) => state.isLoading)
  const isUpdating = useTaskAutomationStore((state) => state.isUpdating)
  const isTriggering = useTaskAutomationStore((state) => state.isTriggering)

  const [formState, setFormState] = useState<AutomationFormState>({
    enabled: false,
    time: DEFAULT_TIME,
    postLimit: 10,
  })

  const [telegramSettings, setTelegramSettings] = useState<{
    phoneNumber: string
    apiId: string
    apiHash: string
  }>({
    phoneNumber: '',
    apiId: '',
    apiHash: '',
  })
  const [isLoadingTelegramSettings, setIsLoadingTelegramSettings] = useState(false)
  const [isSavingTelegramSettings, setIsSavingTelegramSettings] = useState(false)
  const fetchSettingsRef = useRef(fetchSettings)
  fetchSettingsRef.current = fetchSettings

  useEffect(() => {
    if (!settings && !isLoading) {
      void fetchSettingsRef.current()
    }
  }, [settings, isLoading])

  useEffect(() => {
    const loadTelegramSettings = async () => {
      setIsLoadingTelegramSettings(true)
      try {
        const saved = await telegramApi.getSettings()
        if (saved) {
          setTelegramSettings({
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
        setIsLoadingTelegramSettings(false)
      }
    }
    void loadTelegramSettings()
  }, [])

  useEffect(() => {
    if (!settings) {
      return
    }

    const newTime = formatAutomationTime(settings.runHour, settings.runMinute)
    setFormState((prev) => {
      if (
        prev.enabled === settings.enabled &&
        prev.time === newTime &&
        prev.postLimit === settings.postLimit
      ) {
        return prev
      }
      return {
        enabled: settings.enabled,
        time: newTime,
        postLimit: settings.postLimit,
      }
    })
  }, [settings?.enabled, settings?.runHour, settings?.runMinute, settings?.postLimit])

  const nextRun = useMemo(() => {
    if (!settings?.nextRunAt) {
      return '—'
    }
    return formatAutomationDate(settings.nextRunAt)
  }, [settings?.nextRunAt])

  const lastRun = useMemo(() => {
    if (!settings?.lastRunAt) {
      return '—'
    }
    return formatAutomationDate(settings.lastRunAt)
  }, [settings?.lastRunAt])
  const isFormDisabled = !settings || isUpdating

  const handleToggle = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setFormState((prev) => ({
      ...prev,
      enabled: event.target.checked,
    }))
  }, [])

  const handleTimeChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setFormState((prev) => ({
      ...prev,
      time: event.target.value,
    }))
  }, [])

  const handlePostLimitChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = Number.parseInt(event.target.value, 10)
    setFormState((prev) => ({
      ...prev,
      postLimit: Number.isFinite(parsed)
        ? clamp(parsed, MIN_POST_LIMIT, MAX_POST_LIMIT)
        : prev.postLimit,
    }))
  }, [])

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      if (!settings) {
        return
      }

      const [hoursString, minutesString] = formState.time.split(':')
      const runHour = clamp(Number.parseInt(hoursString ?? '0', 10), 0, 23)
      const runMinute = clamp(Number.parseInt(minutesString ?? '0', 10), 0, 59)

      await updateSettings({
        enabled: formState.enabled,
        runHour,
        runMinute,
        postLimit: formState.postLimit,
        timezoneOffsetMinutes: new Date().getTimezoneOffset(),
      })
    },
    [formState, settings, updateSettings],
  )

  const handleRunNow = useCallback(async () => {
    await runNow()
  }, [runNow])

  const handleTelegramPhoneChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setTelegramSettings((prev) => ({
      ...prev,
      phoneNumber: event.target.value,
    }))
  }, [])

  const handleTelegramApiIdChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setTelegramSettings((prev) => ({
      ...prev,
      apiId: event.target.value,
    }))
  }, [])

  const handleTelegramApiHashChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setTelegramSettings((prev) => ({
      ...prev,
      apiHash: event.target.value,
    }))
  }, [])

  const handleSaveTelegramSettings = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      setIsSavingTelegramSettings(true)
      try {
        const payload: TelegramSettingsRequest = {
          phoneNumber: telegramSettings.phoneNumber.trim() || null,
          apiId: telegramSettings.apiId.trim()
            ? Number.parseInt(telegramSettings.apiId.trim(), 10)
            : null,
          apiHash: telegramSettings.apiHash.trim() || null,
        }
        await telegramApi.updateSettings(payload)
        toast.success('Настройки Telegram сохранены')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Не удалось сохранить настройки')
      } finally {
        setIsSavingTelegramSettings(false)
      }
    },
    [telegramSettings],
  )

  const heroActions = (
    <div className="flex flex-col items-end gap-2">
      <Badge
        variant={settings?.enabled ? 'secondary' : 'outline'}
        className={settings?.enabled ? 'bg-accent-primary/20 text-accent-primary' : undefined}
      >
        {settings?.enabled ? 'Автозапуск активен' : 'Автозапуск выключен'}
      </Badge>
      <Button
        variant="outline"
        onClick={handleRunNow}
        disabled={!settings || isTriggering || settings?.isRunning}
      >
        {isTriggering || settings?.isRunning ? 'Запуск...' : 'Запустить сейчас'}
      </Button>
    </div>
  )

  return (
    <div className="flex flex-col gap-8">
      <PageHeroCard
        title="Настройки автозапуска"
        description="Определите расписание ежедневного запуска задач. Мы автоматически создадим задачу на парсинг всех групп в указанное время."
        actions={heroActions}
        footer={
          <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary">
            <span>
              Следующий запуск:{' '}
              <span className="font-medium text-text-primary">{nextRun}</span>
            </span>
            <span>
              Последний запуск:{' '}
              <span className="font-medium text-text-primary">{lastRun}</span>
            </span>
          </div>
        }
      />

      <Card className="bg-background-secondary/60">
        <CardHeader>
          <CardTitle className="text-xl">Расписание</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="flex items-center gap-3 text-sm font-medium text-text-primary">
                <input
                  type="checkbox"
                  checked={formState.enabled}
                  onChange={handleToggle}
                  className="h-5 w-5 rounded border-border bg-background-primary accent-accent-primary"
                  disabled={isFormDisabled}
                />
                Включить автозапуск задач
              </label>
              <p className="text-sm text-text-secondary">
                При включении каждый день будет создаваться задача на парсинг всех групп в указанное ниже время.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="automation-time">Время запуска (по серверу)</Label>
                <Input
                  id="automation-time"
                  type="time"
                  value={formState.time}
                  onChange={handleTimeChange}
                  disabled={isFormDisabled}
                  required
                />
                <p className="text-xs text-text-secondary">
                  Укажите часы и минуты, когда задача должна стартовать каждый день.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="automation-post-limit">Лимит постов на группу</Label>
                <Input
                  id="automation-post-limit"
                  type="number"
                  min={1}
                  max={100}
                  value={formState.postLimit}
                  onChange={handlePostLimitChange}
                  disabled={isFormDisabled}
                  required
                />
                <p className="text-xs text-text-secondary">
                  Количество последних постов каждой группы, которые нужно проанализировать.
                </p>
              </div>
            </div>

            <Button type="submit" disabled={isFormDisabled}>
              {isUpdating ? 'Сохраняем...' : 'Сохранить изменения'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex-col items-start gap-2 text-sm text-text-secondary">
          <span>
            Следующий запуск:{' '}
            <span className="font-medium text-text-primary">{nextRun}</span>
          </span>
          <span>
            Последний запуск:{' '}
            <span className="font-medium text-text-primary">{lastRun}</span>
          </span>
        </CardFooter>
      </Card>

      <Card className="bg-background-secondary/60">
        <CardHeader>
          <CardTitle className="text-xl">Настройки Telegram</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSaveTelegramSettings}>
            <div className="rounded-lg border border-border/60 bg-background-primary/70 px-4 py-3 text-sm text-text-secondary">
              <p>
                Укажите данные для создания Telegram сессии. Эти настройки будут использоваться автоматически при создании новой сессии.
              </p>
              <p className="mt-2 text-xs text-text-tertiary">
                API ID и API Hash можно получить на{' '}
                <a
                  href="https://my.telegram.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline hover:text-primary/80"
                >
                  my.telegram.org
                </a>
                .
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="telegram-phone">Номер телефона</Label>
                <Input
                  id="telegram-phone"
                  type="tel"
                  value={telegramSettings.phoneNumber}
                  onChange={handleTelegramPhoneChange}
                  placeholder="+79998887766"
                  disabled={isLoadingTelegramSettings || isSavingTelegramSettings}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telegram-api-id">API ID</Label>
                <Input
                  id="telegram-api-id"
                  type="number"
                  value={telegramSettings.apiId}
                  onChange={handleTelegramApiIdChange}
                  placeholder="12345678"
                  disabled={isLoadingTelegramSettings || isSavingTelegramSettings}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telegram-api-hash">API Hash</Label>
                <Input
                  id="telegram-api-hash"
                  value={telegramSettings.apiHash}
                  onChange={handleTelegramApiHashChange}
                  placeholder="abcdef1234567890abcdef1234567890"
                  disabled={isLoadingTelegramSettings || isSavingTelegramSettings}
                />
              </div>
            </div>

            <Button type="submit" disabled={isLoadingTelegramSettings || isSavingTelegramSettings}>
              {isSavingTelegramSettings ? 'Сохраняем...' : 'Сохранить настройки'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default Settings
