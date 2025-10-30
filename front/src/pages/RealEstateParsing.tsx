import { useEffect, useMemo, useState } from 'react'

import PageHeroCard from '@/components/PageHeroCard'
import SectionCard from '@/components/SectionCard'
import RealEstateScheduleModal from '@/components/RealEstateScheduleModal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ButtonGroup } from '@/components/ui/button-group'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRealEstateScheduleStore } from '@/stores'
import type { RealEstateScheduleSettings } from '@/types/realEstate'

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
      console.warn('[RealEstateParsing] Failed to format date', error)
    }
    return new Date(value).toLocaleString('ru-RU')
  }
}

const formatTime = (settings: RealEstateScheduleSettings | null): string => {
  if (!settings) {
    return '—'
  }

  const hours = String(Math.max(0, Math.min(23, settings.runHour))).padStart(2, '0')
  const minutes = String(Math.max(0, Math.min(59, settings.runMinute))).padStart(2, '0')
  return `${hours}:${minutes}`
}

type ParsingSource = 'AVITO' | 'YOULA'

const sourceOptions: Array<{ label: string; value: ParsingSource; description: string }> = [
  {
    value: 'AVITO',
    label: 'Авито',
    description:
      'Ежедневный сбор объявлений о недвижимости с фильтрами и автоматическим расписанием.',
  },
  {
    value: 'YOULA',
    label: 'Юла',
    description: 'Проверка новых объявлений с Юлы и обновление существующих карточек.',
  },
]

function RealEstateParsing() {
  const [selectedSource, setSelectedSource] = useState<ParsingSource>('AVITO')
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [manualMode, setManualMode] = useState(true)
  const [manualWaitInput, setManualWaitInput] = useState('5000')

  const scheduleSettings = useRealEstateScheduleStore((state) => state.settings)
  const scheduleSummary = useRealEstateScheduleStore((state) => state.summary)
  const fetchScheduleSettings = useRealEstateScheduleStore((state) => state.fetchSettings)
  const updateScheduleSettings = useRealEstateScheduleStore((state) => state.updateSettings)
  const runScheduleNow = useRealEstateScheduleStore((state) => state.runNow)
  const isScheduleLoading = useRealEstateScheduleStore((state) => state.isLoading)
  const isScheduleUpdating = useRealEstateScheduleStore((state) => state.isUpdating)
  const isScheduleRunning = useRealEstateScheduleStore((state) => state.isRunning)

  useEffect(() => {
    if (!scheduleSettings && !isScheduleLoading) {
      void fetchScheduleSettings()
    }
  }, [scheduleSettings, isScheduleLoading, fetchScheduleSettings])

  const lastRun = useMemo(
    () => formatDateTime(scheduleSettings?.lastRunAt),
    [scheduleSettings?.lastRunAt]
  )
  const nextRun = useMemo(
    () => formatDateTime(scheduleSettings?.nextRunAt),
    [scheduleSettings?.nextRunAt]
  )
  const scheduleTime = useMemo(() => formatTime(scheduleSettings), [scheduleSettings])
  const isScheduleEnabled = Boolean(scheduleSettings?.enabled)

  const totalCreated = useMemo(() => {
    if (!scheduleSummary) {
      return 0
    }
    return scheduleSummary.avito.created.length + scheduleSummary.youla.created.length
  }, [scheduleSummary])

  const totalUpdated = useMemo(() => {
    if (!scheduleSummary) {
      return 0
    }
    return scheduleSummary.avito.updated.length + scheduleSummary.youla.updated.length
  }, [scheduleSummary])

  const handleSourceChange = (value: ParsingSource) => {
    setSelectedSource(value)
  }

  const handleOpenScheduleModal = () => {
    if (!scheduleSettings && !isScheduleLoading) {
      void fetchScheduleSettings()
    }
    setIsScheduleModalOpen(true)
  }

  const handleRunSchedule = async () => {
    const parsedWait = Number.parseInt(manualWaitInput, 10)
    const normalizedWait = Number.isFinite(parsedWait) && parsedWait >= 0 ? parsedWait : undefined

    await runScheduleNow({
      manual: manualMode,
      headless: manualMode ? false : true,
      manualWaitAfterMs: manualMode ? normalizedWait : undefined,
    })
  }

  const heroActions = (
    <div className="flex flex-col gap-3 md:flex-row md:items-end">
      <div className="flex w-full flex-col gap-2 rounded-2xl border border-border bg-background-primary/60 p-3 md:max-w-sm">
        <div className="flex items-center gap-2">
          <input
            id="real-estate-manual-mode"
            type="checkbox"
            checked={manualMode}
            onChange={(event) => setManualMode(event.target.checked)}
            className="h-4 w-4 rounded border-border text-accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2"
          />
          <Label htmlFor="real-estate-manual-mode" className="text-sm font-medium">
            Ручной режим (открытый браузер)
          </Label>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="real-estate-manual-wait" className="text-xs text-text-secondary">
            Задержка после подтверждения, мс
          </Label>
          <Input
            id="real-estate-manual-wait"
            type="number"
            min={0}
            step={500}
            value={manualWaitInput}
            onChange={(event) => setManualWaitInput(event.target.value)}
            disabled={!manualMode}
            className="h-9"
            placeholder={String(5000)}
          />
        </div>
      </div>
      <div className="flex flex-col gap-3 md:flex-row">
        <Button
          variant="outline"
          onClick={handleRunSchedule}
          disabled={isScheduleRunning || scheduleSettings?.isRunning}
        >
          {isScheduleRunning || scheduleSettings?.isRunning ? 'Запуск...' : 'Запустить сейчас'}
        </Button>
        <Button onClick={handleOpenScheduleModal} disabled={isScheduleLoading}>
          Настроить расписание
        </Button>
      </div>
    </div>
  )

  const heroFooter = (
    <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary">
      <span>
        Следующий запуск: <span className="font-medium text-text-primary">{nextRun}</span>
      </span>
      <span>
        Последний запуск: <span className="font-medium text-text-primary">{lastRun}</span>
      </span>
      <span>
        Время запуска: <span className="font-medium text-text-primary">{scheduleTime}</span>
      </span>
    </div>
  )

  return (
    <div className="flex flex-col gap-8">
      <PageHeroCard
        title="Парсинг данных"
        description="Управляйте сбором объявлений из Авито и Юлы: запускайте сбор вручную или настраивайте автоматическое расписание."
        actions={heroActions}
        footer={heroFooter}
      />

      <SectionCard
        title="Выбор источника"
        description="Переключайтесь между каналами, чтобы настроить соответствующие параметры и запуск."
        contentClassName="flex flex-col gap-4"
      >
        <ButtonGroup className="flex flex-wrap gap-2" orientation="horizontal">
          {sourceOptions.map((option) => (
            <Button
              key={option.value}
              variant={selectedSource === option.value ? 'default' : 'outline'}
              onClick={() => handleSourceChange(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </ButtonGroup>
        <p className="text-sm text-text-secondary">
          {sourceOptions.find((option) => option.value === selectedSource)?.description}
        </p>
      </SectionCard>

      <SectionCard
        title={selectedSource === 'AVITO' ? 'Расписание парсинга Авито' : 'Расписание парсинга Юлы'}
        description="Настройте ежедневный запуск и отслеживайте статус последних сборов."
        headerActions={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Badge
              variant={isScheduleEnabled ? 'secondary' : 'outline'}
              className={isScheduleEnabled ? 'bg-accent-primary/20 text-accent-primary' : undefined}
            >
              {isScheduleEnabled ? 'Расписание активно' : 'Расписание выключено'}
            </Badge>
            <Button
              variant="outline"
              onClick={handleOpenScheduleModal}
              disabled={isScheduleLoading}
            >
              Настроить
            </Button>
          </div>
        }
        contentClassName="space-y-4"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-background-primary/40 p-4 shadow-soft-sm">
            <p className="text-sm text-text-secondary">
              Время запуска: <span className="font-medium text-text-primary">{scheduleTime}</span>
            </p>
            <p className="text-sm text-text-secondary">
              Следующий запуск: <span className="font-medium text-text-primary">{nextRun}</span>
            </p>
            <p className="text-sm text-text-secondary">
              Последний запуск: <span className="font-medium text-text-primary">{lastRun}</span>
            </p>
            <p className="text-sm text-text-secondary">
              Текущее состояние:{' '}
              <span className="font-medium text-text-primary">
                {isScheduleRunning || scheduleSettings?.isRunning
                  ? 'Выполняется'
                  : isScheduleEnabled
                    ? 'Ожидает запуска'
                    : 'Выключено'}
              </span>
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-background-primary/40 p-4 shadow-soft-sm">
            <p className="text-sm text-text-secondary">
              Источники в запуске:{' '}
              <span className="font-medium text-text-primary">Авито и Юла</span>
            </p>
            <p className="text-sm text-text-secondary">
              Новых объявлений за последнюю итерацию:{' '}
              <span className="font-medium text-text-primary">{totalCreated}</span>
            </p>
            <p className="text-sm text-text-secondary">
              Обновлено объявлений:{' '}
              <span className="font-medium text-text-primary">{totalUpdated}</span>
            </p>
            <Button
              className="mt-4 w-full"
              onClick={handleRunSchedule}
              disabled={isScheduleRunning || scheduleSettings?.isRunning}
            >
              {isScheduleRunning || scheduleSettings?.isRunning ? 'Запуск...' : 'Запустить сейчас'}
            </Button>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Итоги последнего запуска"
        description="Краткая статистика по источникам за последний ручной или автоматический запуск."
        contentClassName="space-y-4"
      >
        {scheduleSummary ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { label: 'Авито', key: 'avito' as const },
              { label: 'Юла', key: 'youla' as const },
            ].map((item) => {
              const result = scheduleSummary[item.key]
              return (
                <div
                  key={item.key}
                  className="rounded-2xl border border-border bg-background-primary/40 p-4 shadow-soft-sm"
                >
                  <h3 className="text-base font-semibold text-text-primary">{item.label}</h3>
                  <p className="text-sm text-text-secondary">
                    Просканировано страниц:{' '}
                    <span className="font-medium text-text-primary">{result.scrapedCount}</span>
                  </p>
                  <p className="text-sm text-text-secondary">
                    Новых объявлений:{' '}
                    <span className="font-medium text-text-primary">{result.created.length}</span>
                  </p>
                  <p className="text-sm text-text-secondary">
                    Обновлено объявлений:{' '}
                    <span className="font-medium text-text-primary">{result.updated.length}</span>
                  </p>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/60 bg-background-primary/30 p-6 text-sm text-text-secondary">
            Результаты появятся после первого запуска парсинга.
          </div>
        )}
      </SectionCard>
      <RealEstateScheduleModal
        isOpen={isScheduleModalOpen}
        settings={scheduleSettings}
        summary={scheduleSummary}
        isSaving={isScheduleUpdating}
        isRunning={isScheduleRunning || Boolean(scheduleSettings?.isRunning)}
        onClose={() => setIsScheduleModalOpen(false)}
        onSubmit={updateScheduleSettings}
        onRunNow={runScheduleNow}
      />
    </div>
  )
}

export default RealEstateParsing
