import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import PageHeroCard from '../components/PageHeroCard'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { useTaskAutomationStore } from '../stores'
import { clamp, formatAutomationDate, formatAutomationTime } from '../utils/automationFormatting'
import { telegramApi } from '../api/telegramApi'
import type { TelegramSettingsRequest } from '../types/api'
import toast from 'react-hot-toast'
import { 
  Clock, 
  Play, 
  Save, 
  Smartphone, 
  Key, 
  Hash, 
  Calendar, 
  Activity,
  Zap,
  Info,
  Send
} from 'lucide-react'

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
        className={settings?.enabled ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-muted text-muted-foreground'}
      >
        {settings?.enabled ? 'Автозапуск активен' : 'Автозапуск выключен'}
      </Badge>
      <Button
        variant="default"
        size="sm"
        onClick={handleRunNow}
        disabled={!settings || isTriggering || settings?.isRunning}
        className="bg-accent-primary hover:bg-accent-primary/90"
      >
        <Play className="mr-2 h-4 w-4" />
        {isTriggering || settings?.isRunning ? 'Запуск...' : 'Запустить сейчас'}
      </Button>
    </div>
  )

  return (
    <div className="flex flex-col gap-6 pb-8">
      <PageHeroCard
        title="Настройки системы"
        description="Управление расписанием автоматического парсинга и интеграциями."
        actions={heroActions}
      />

      <div className="grid gap-6 lg:grid-cols-2 items-start">
        {/* Automation Card */}
        <Card className="border-border/50 bg-background-secondary/40 shadow-sm h-full flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-accent-primary/10 text-accent-primary">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">Расписание парсинга</CardTitle>
                <CardDescription>Настройка ежедневных задач</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <form id="automation-form" className="space-y-6" onSubmit={handleSubmit}>
              <div className="rounded-lg border border-border/50 bg-background/50 p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Автоматический запуск</Label>
                    <p className="text-sm text-muted-foreground">
                      Создавать задачи на парсинг всех групп каждый день
                    </p>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formState.enabled}
                      onChange={handleToggle}
                      className="h-5 w-5 rounded border-border bg-background text-accent-primary focus:ring-offset-0 focus:ring-accent-primary"
                      disabled={isFormDisabled}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="automation-time" className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Время запуска
                  </Label>
                  <Input
                    id="automation-time"
                    type="time"
                    value={formState.time}
                    onChange={handleTimeChange}
                    disabled={isFormDisabled}
                    className="bg-background/50"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Время сервера
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="automation-post-limit" className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    Лимит постов
                  </Label>
                  <Input
                    id="automation-post-limit"
                    type="number"
                    min={1}
                    max={100}
                    value={formState.postLimit}
                    onChange={handlePostLimitChange}
                    disabled={isFormDisabled}
                    className="bg-background/50"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Постов на группу
                  </p>
                </div>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 border-t border-border/50 bg-background/30 pt-4">
            <div className="grid w-full grid-cols-2 gap-4 text-sm">
              <div className="flex flex-col gap-1 rounded-md bg-background/50 p-2 border border-border/50">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Следующий запуск
                </span>
                <span className="font-medium">{nextRun}</span>
              </div>
              <div className="flex flex-col gap-1 rounded-md bg-background/50 p-2 border border-border/50">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Zap className="h-3 w-3" /> Последний запуск
                </span>
                <span className="font-medium">{lastRun}</span>
              </div>
            </div>
            <Button type="submit" form="automation-form" className="w-full" disabled={isFormDisabled}>
              {isUpdating ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Сохраняем...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Сохранить расписание
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Telegram Card */}
        <Card className="border-border/50 bg-background-secondary/40 shadow-sm h-full flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                <Send className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">Telegram API</CardTitle>
                <CardDescription>Настройки подключения</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 flex-1">
             <div className="rounded-md bg-blue-500/10 p-4 text-sm text-blue-600 dark:text-blue-400 flex gap-3 items-start">
                <Info className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p>Для работы интеграции требуются API credentials.</p>
                  <p className="text-xs opacity-80">
                    Их можно получить на{' '}
                    <a
                      href="https://my.telegram.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:opacity-100 font-medium"
                    >
                      my.telegram.org
                    </a>
                  </p>
                </div>
              </div>

            <form id="telegram-form" className="space-y-4" onSubmit={handleSaveTelegramSettings}>
              <div className="space-y-2">
                <Label htmlFor="telegram-phone" className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  Номер телефона
                </Label>
                <Input
                  id="telegram-phone"
                  type="tel"
                  value={telegramSettings.phoneNumber}
                  onChange={handleTelegramPhoneChange}
                  placeholder="+79998887766"
                  disabled={isLoadingTelegramSettings || isSavingTelegramSettings}
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telegram-api-id" className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  API ID
                </Label>
                <Input
                  id="telegram-api-id"
                  type="number"
                  value={telegramSettings.apiId}
                  onChange={handleTelegramApiIdChange}
                  placeholder="12345678"
                  disabled={isLoadingTelegramSettings || isSavingTelegramSettings}
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telegram-api-hash" className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-muted-foreground" />
                  API Hash
                </Label>
                <Input
                  id="telegram-api-hash"
                  value={telegramSettings.apiHash}
                  onChange={handleTelegramApiHashChange}
                  placeholder="abcdef1234567890..."
                  disabled={isLoadingTelegramSettings || isSavingTelegramSettings}
                  className="bg-background/50 font-mono text-xs"
                />
              </div>
            </form>
          </CardContent>
          <CardFooter className="border-t border-border/50 bg-background/30 pt-4 mt-auto">
            <Button 
              type="submit" 
              form="telegram-form" 
              className="w-full" 
              disabled={isLoadingTelegramSettings || isSavingTelegramSettings}
              variant="secondary"
            >
              {isSavingTelegramSettings ? (
                <>
                   <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                   Сохраняем...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Сохранить настройки
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export default Settings
