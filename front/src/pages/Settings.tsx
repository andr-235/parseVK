import { useCallback, useEffect, useMemo, useState } from 'react'
import PageHeroCard from '../components/PageHeroCard'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { useTaskAutomationStore } from '../stores'
import { clamp, formatAutomationDate, formatAutomationTime } from '../utils/automationFormatting'

interface AutomationFormState {
  enabled: boolean
  time: string
  postLimit: number
}

const DEFAULT_TIME = '03:00'
const MIN_POST_LIMIT = 1
const MAX_POST_LIMIT = 100

function Settings() {
  const {
    settings,
    fetchSettings,
    updateSettings,
    runNow,
    isLoading,
    isUpdating,
    isTriggering,
  } = useTaskAutomationStore((state) => ({
    settings: state.settings,
    fetchSettings: state.fetchSettings,
    updateSettings: state.updateSettings,
    runNow: state.runNow,
    isLoading: state.isLoading,
    isUpdating: state.isUpdating,
    isTriggering: state.isTriggering,
  }))

  const [formState, setFormState] = useState<AutomationFormState>({
    enabled: false,
    time: DEFAULT_TIME,
    postLimit: 10,
  })

  useEffect(() => {
    if (!settings && !isLoading) {
      void fetchSettings()
    }
  }, [settings, isLoading, fetchSettings])

  useEffect(() => {
    if (!settings) {
      return
    }

    setFormState({
      enabled: settings.enabled,
      time: formatAutomationTime(settings.runHour, settings.runMinute),
      postLimit: settings.postLimit,
    })
  }, [settings])

  const nextRun = useMemo(
    () => formatAutomationDate(settings?.nextRunAt ?? null),
    [settings?.nextRunAt],
  )
  const lastRun = useMemo(
    () => formatAutomationDate(settings?.lastRunAt ?? null),
    [settings?.lastRunAt],
  )
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
    </div>
  )
}

export default Settings
