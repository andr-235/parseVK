import { Settings } from 'lucide-react'
import { Button, Input, Checkbox } from '../../../components/ui'

type SettingsPanelProps = {
  expanded: boolean
  onClose: () => void
  onSave: () => void
  trackAllComments: boolean
  setTrackAllComments: (v: boolean) => void
  pollInterval: number
  setPollInterval: (v: number) => void
  maxAuthors: number
  setMaxAuthors: (v: number) => void
  isSaving: boolean
}

export function SettingsPanel({
  expanded,
  onClose,
  onSave,
  trackAllComments,
  setTrackAllComments,
  pollInterval,
  setPollInterval,
  maxAuthors,
  setMaxAuthors,
  isSaving
}: SettingsPanelProps) {
  if (!expanded) return null
  return (
    <div className="rounded-md border border-border bg-bg-panel p-4 animate-fade-in">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-primary flex items-center gap-2">
        <Settings size={14} /> Настройки фонового мониторинга
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
        <div className="flex flex-col gap-2">
          <label htmlFor="poll-interval" className="text-xs font-medium text-text-secondary">Интервал опроса (в минутах)</label>
          <Input
            id="poll-interval"
            type="number"
            min={1}
            max={1440}
            value={pollInterval}
            onChange={(e) => setPollInterval(parseInt(e.target.value) || 5)}
            className="max-w-[120px] flex-none basis-auto"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="max-authors" className="text-xs font-medium text-text-secondary">Лимит авторов</label>
          <Input
            id="max-authors"
            type="number"
            min={1}
            max={200}
            value={maxAuthors}
            onChange={(e) => setMaxAuthors(parseInt(e.target.value) || 50)}
            className="max-w-[120px] flex-none basis-auto"
          />
        </div>
        <div className="flex items-center">
          <label className="flex items-center gap-2 text-xs font-medium text-text-secondary cursor-pointer h-8">
            <Checkbox
              id="track-all"
              checked={trackAllComments}
              onChange={(e) => setTrackAllComments(e.target.checked)}
            />
            <span>Опрашивать новые комментарии</span>
          </label>
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-3 border-t border-border pt-3">
        <Button variant="secondary" size="xs" onClick={onClose}>
          Отмена
        </Button>
        <Button
          variant="primary"
          semantic="default"
          size="xs"
          onClick={onSave}
          disabled={isSaving}
        >
          {isSaving ? 'Сохранение...' : 'Сохранить'}
        </Button>
      </div>
    </div>
  )
}
