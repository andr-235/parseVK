import { useEffect, useMemo, useState } from 'react'

import type {
  RealEstateDailyCollectResult,
  RealEstateScheduleSettings,
  RealEstateScheduleUpdatePayload,
} from '@/types/realEstate'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface RealEstateScheduleModalProps {
  isOpen: boolean
  settings: RealEstateScheduleSettings | null
  summary: RealEstateDailyCollectResult | null
  isSaving: boolean
  isRunning: boolean
  onClose: () => void
  onSubmit: (payload: RealEstateScheduleUpdatePayload) => Promise<boolean>
  onRunNow: () => Promise<boolean>
}

const formatTime = (hours: number | null | undefined, minutes: number | null | undefined): string => {
  const safeHours = Number.isFinite(hours) ? Math.max(0, Math.min(23, Number(hours))) : 0
  const safeMinutes = Number.isFinite(minutes) ? Math.max(0, Math.min(59, Number(minutes))) : 0
  return `${String(safeHours).padStart(2, '0')}:${String(safeMinutes).padStart(2, '0')}`
}

const formatDateTime = (value: string | null | undefined): string => {
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
      console.warn('[RealEstateScheduleModal] Failed to format date', error)
    }
    return new Date(value).toLocaleString('ru-RU')
  }
}

function RealEstateScheduleModal({
  isOpen,
  settings,
  summary,
  isSaving,
  isRunning,
  onClose,
  onSubmit,
  onRunNow,
}: RealEstateScheduleModalProps) {
  const [enabled, setEnabled] = useState(settings?.enabled ?? false)
  const [time, setTime] = useState(() => formatTime(settings?.runHour, settings?.runMinute))

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setEnabled(settings?.enabled ?? false)
    setTime(formatTime(settings?.runHour, settings?.runMinute))
  }, [isOpen, settings?.enabled, settings?.runHour, settings?.runMinute])

  const nextRun = useMemo(() => formatDateTime(settings?.nextRunAt), [settings?.nextRunAt])
  const lastRun = useMemo(() => formatDateTime(settings?.lastRunAt), [settings?.lastRunAt])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const [hoursString, minutesString] = time.split(':')
    const runHour = Number.parseInt(hoursString ?? '0', 10)
    const runMinute = Number.parseInt(minutesString ?? '0', 10)

    const payload: RealEstateScheduleUpdatePayload = {
      enabled,
      runHour: Number.isFinite(runHour) ? Math.max(0, Math.min(23, runHour)) : 0,
      runMinute: Number.isFinite(runMinute) ? Math.max(0, Math.min(59, runMinute)) : 0,
      timezoneOffsetMinutes: new Date().getTimezoneOffset(),
    }

    const success = await onSubmit(payload)

    if (success) {
      onClose()
    }
  }

  const handleRunNow = async () => {
    await onRunNow()
  }

  if (!isOpen) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex w-full max-h-[90vh] max-w-3xl flex-col overflow-hidden rounded-3xl bg-background-secondary text-text-primary shadow-soft-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="real-estate-schedule-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-border px-8 py-6">
          <div className="space-y-2">
            <h2 id="real-estate-schedule-title" className="text-2xl font-semibold tracking-tight">
              Расписание парсинга объявлений
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-text-secondary">
              Укажите время запуска ежедневного парсинга и включите нужные источники. При необходимости можно запустить сбор вручную.
            </p>
          </div>
          <button
            type="button"
            className="rounded-full bg-background-primary/40 p-2 text-2xl leading-none text-text-secondary transition-colors duration-200 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/60"
            onClick={onClose}
            aria-label="Закрыть модальное окно"
          >
            ×
          </button>
        </header>

        <form className="flex flex-1 flex-col" onSubmit={handleSubmit}>
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">
            <section className="space-y-4">
              <div className="flex flex-col gap-3 rounded-2xl border border-border bg-background-primary/50 p-4 shadow-soft-sm">
                <label className="flex items-center gap-3 text-sm font-medium text-text-primary">
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-border bg-background-primary accent-accent-primary"
                    checked={enabled}
                    onChange={(event) => setEnabled(event.target.checked)}
                  />
                  Включить ежедневный парсинг
                </label>
                <p className="text-sm text-text-secondary">
                  Когда расписание активно, парсер соберёт объявления с Авито и Юлы в указанное время.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="real-estate-schedule-time">Время запуска (по серверу)</Label>
                  <Input
                    id="real-estate-schedule-time"
                    type="time"
                    value={time}
                    onChange={(event) => setTime(event.target.value)}
                    required
                  />
                  <p className="text-xs text-text-secondary">
                    Часы и минуты запуска ежедневного сбора объявлений.
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
                    Статус
                  </span>
                  <div className="rounded-2xl border border-border bg-background-primary/50 p-4 shadow-soft-sm">
                    <p className="text-sm text-text-secondary">
                      Следующий запуск: <span className="font-medium text-text-primary">{nextRun}</span>
                    </p>
                    <p className="text-sm text-text-secondary">
                      Последний запуск: <span className="font-medium text-text-primary">{lastRun}</span>
                    </p>
                    <p className="text-sm text-text-secondary">
                      Текущее состояние:{' '}
                      <span className="font-medium text-text-primary">
                        {isRunning || settings?.isRunning ? 'Выполняется' : enabled ? 'Ожидает запуска' : 'Выключено'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex flex-col gap-3">
                <span className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
                  Результаты последнего запуска
                </span>
                {summary ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {(['avito', 'youla'] as const).map((key) => {
                      const result = summary[key]
                      return (
                        <div
                          key={key}
                          className="flex flex-col gap-2 rounded-2xl border border-border bg-background-primary/50 p-4 shadow-soft-sm"
                        >
                          <span className="text-sm font-semibold text-text-primary">
                            {key === 'avito' ? 'Авито' : 'Юла'}
                          </span>
                          <p className="text-sm text-text-secondary">
                            Просканировано страниц: <span className="font-medium text-text-primary">{result.scrapedCount}</span>
                          </p>
                          <p className="text-sm text-text-secondary">
                            Новых объявлений: <span className="font-medium text-text-primary">{result.created.length}</span>
                          </p>
                          <p className="text-sm text-text-secondary">
                            Обновлено объявлений: <span className="font-medium text-text-primary">{result.updated.length}</span>
                          </p>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-border/70 bg-background-primary/40 p-6 text-sm text-text-secondary">
                    Данные появятся после выполнения ручного или автоматического запуска.
                  </div>
                )}
              </div>
            </section>
          </div>

          <footer className="flex flex-col gap-3 border-t border-border bg-background-secondary/60 px-8 py-6 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={onClose} className="w-full sm:w-auto">
              Отмена
            </Button>
            <Button
              type="button"
              onClick={handleRunNow}
              disabled={isRunning || settings?.isRunning}
              className="w-full sm:w-auto"
              variant="outline"
            >
              {isRunning || settings?.isRunning ? 'Запуск...' : 'Запустить вручную'}
            </Button>
            <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
              {isSaving ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </footer>
        </form>
      </div>
    </div>
  )
}

export default RealEstateScheduleModal
