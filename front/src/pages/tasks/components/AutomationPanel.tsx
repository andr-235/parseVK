import { useState, useEffect } from 'react'
import { Play, ToggleLeft, ToggleRight } from 'lucide-react'
import { Button, Input, Spinner } from '../../../components/ui'
import type { AutomationSettings, AutomationSettingsUpdate } from '../../../shared/api/tasks'

const DEFAULT_TZ_OFFSET = 180

type Props = {
  settings: AutomationSettings | undefined
  isLoading: boolean
  onSave: (settings: AutomationSettingsUpdate) => void
  onRun: () => void
  isSaving: boolean
  isRunning: boolean
}

export function AutomationPanel({ settings, isLoading, onSave, onRun, isSaving, isRunning }: Props) {
  const [enabled, setEnabled] = useState(false)
  const [hour, setHour] = useState(8)
  const [minute, setMinute] = useState(0)
  const [postLimit, setPostLimit] = useState(10)

  useEffect(() => {
    if (settings) {
      setEnabled(settings.enabled)
      setHour(settings.runHour)
      setMinute(settings.runMinute)
      setPostLimit(settings.postLimit)
    }
  }, [settings])

  if (isLoading) {
    return (
      <div className="mb-4 rounded-md border border-border bg-bg-panel p-4">
        <div className="flex items-center gap-2 py-2 text-xs text-text-muted">
          <Spinner size={14} />
          Загрузка настроек...
        </div>
      </div>
    )
  }

  return (
    <div className="mb-4 rounded-md border border-border bg-bg-panel p-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEnabled((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              enabled
                ? 'bg-accent text-white'
                : 'border border-border text-text-secondary hover:bg-bg-hover'
            }`}
            aria-pressed={enabled}
          >
            {enabled ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
            {enabled ? 'Автосбор включён' : 'Автосбор выключен'}
          </button>
        </div>
        <div>
          <label className="mb-1 block text-xs text-text-muted">Время (МСК)</label>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min={0}
              max={23}
              value={hour}
              onChange={(e) => setHour(isNaN(Number(e.target.value)) ? 0 : Math.min(23, Math.max(0, Number(e.target.value))))}
              className="w-14 text-center"
            />
            <span className="text-text-muted">:</span>
            <Input
              type="number"
              min={0}
              max={59}
              value={minute}
              onChange={(e) => setMinute(isNaN(Number(e.target.value)) ? 0 : Math.min(59, Math.max(0, Number(e.target.value))))}
              className="w-14 text-center"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs text-text-muted">Лимит постов</label>
          <Input
            type="number"
            min={1}
            max={100}
            value={postLimit}
            onChange={(e) => setPostLimit(Number(e.target.value))}
            className="w-20"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="soft" size="xs" semantic="default"
            onClick={() => onSave({
              enabled,
              runHour: hour,
              runMinute: minute,
              postLimit,
              timezoneOffsetMinutes: DEFAULT_TZ_OFFSET,
            })}
            disabled={isSaving}
            icon={isSaving ? <Spinner size={12} /> : undefined}
          >
            {isSaving ? 'Сохранение...' : 'Сохранить'}
          </Button>
          <Button
            variant="secondary" size="xs"
            onClick={onRun}
            disabled={isRunning || !enabled}
            icon={isRunning ? <Spinner size={12} /> : <Play size={12} />}
          >
            {isRunning ? 'Запуск...' : 'Запустить сейчас'}
          </Button>
        </div>
        {settings && (
          <div className="w-full text-xs text-text-muted">
            {settings.lastRunAt && (
              <span>Последний запуск: {new Date(settings.lastRunAt).toLocaleString('ru-RU')}</span>
            )}
            {settings.lastRunAt && settings.nextRunAt && <span className="mx-2">·</span>}
            {settings.nextRunAt && (
              <span>Следующий: {new Date(settings.nextRunAt).toLocaleString('ru-RU')}</span>
            )}
            {settings.isRunning && (
              <span className="ml-2 text-accent">Выполняется...</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
