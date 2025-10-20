import { useEffect, useMemo, useState } from 'react'
import PageHeroCard from '../components/PageHeroCard'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/card'
import { Label } from '../components/ui/label'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { useTaskAutomationStore } from '../stores'

interface AutomationFormState {
  enabled: boolean
  time: string
  postLimit: number
}

const DEFAULT_TIME = '03:00'

function formatTime(hours: number, minutes: number): string {
  const safeHours = Number.isFinite(hours) ? Math.max(0, Math.min(23, hours)) : 0
  const safeMinutes = Number.isFinite(minutes) ? Math.max(0, Math.min(59, minutes)) : 0
  return `${String(safeHours).padStart(2, '0')}:${String(safeMinutes).padStart(2, '0')}`
}

function formatDate(value: string | null): string {
  if (!value) {
    return '—'
  }

  try {
    return new Intl.DateTimeFormat('ru-RU', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[Settings] Failed to format automation date', error)
    }
    return new Date(value).toLocaleString('ru-RU')
  }
}

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
      time: formatTime(settings.runHour, settings.runMinute),
      postLimit: settings.postLimit,
    })
  }, [settings])

  const nextRun = useMemo(() => formatDate(settings?.nextRunAt ?? null), [settings?.nextRunAt])
  const lastRun = useMemo(() => formatDate(settings?.lastRunAt ?? null), [settings?.lastRunAt])
  const isFormDisabled = !settings || isUpdating

  const handleToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormState((prev) => ({
      ...prev,
      enabled: event.target.checked,
    }))
  }

  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormState((prev) => ({
      ...prev,
      time: event.target.value,
    }))
  }

  const handlePostLimitChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = Number.parseInt(event.target.value, 10)
    setFormState((prev) => ({
      ...prev,
      postLimit: Number.isFinite(parsed) ? Math.max(1, Math.min(100, parsed)) : prev.postLimit,
    }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!settings) {
      return
    }

    const [hoursString, minutesString] = formState.time.split(':')
    const runHour = Number.parseInt(hoursString ?? '0', 10)
    const runMinute = Number.parseInt(minutesString ?? '0', 10)

    await updateSettings({
      enabled: formState.enabled,
      runHour: Number.isFinite(runHour) ? Math.max(0, Math.min(23, runHour)) : 0,
      runMinute: Number.isFinite(runMinute) ? Math.max(0, Math.min(59, runMinute)) : 0,
      postLimit: formState.postLimit,
      timezoneOffsetMinutes: new Date().getTimezoneOffset(),
    })
  }

  const handleRunNow = async () => {
    await runNow()
  }

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
