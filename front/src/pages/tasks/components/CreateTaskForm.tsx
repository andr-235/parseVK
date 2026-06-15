import { useState } from 'react'
import { Play, X, ListChecks } from 'lucide-react'
import { Button, Input, Select, Spinner } from '../../../components/ui'
import type { TaskScope, TaskMode, CreateTaskParams } from '../../../shared/api/tasks'
import type { Group } from '../../../shared/api/groups'
import { GroupSelectModal } from './GroupSelectModal'

const SCOPE_OPTIONS: readonly TaskScope[] = ['all', 'selected'] as const
const MODE_LABELS: Record<TaskMode, string> = {
  recent_posts: 'Свежие посты',
  recheck_group: 'Перепроверка',
}
const MODE_ITEMS = Object.entries(MODE_LABELS) as [TaskMode, string][]

type Props = {
  onSubmit: (params: CreateTaskParams) => void
  onCancel: () => void
  isPending: boolean
}

export function CreateTaskForm({ onSubmit, onCancel, isPending }: Props) {
  const [scope, setScope] = useState<TaskScope>('all')
  const [selectedGroups, setSelectedGroups] = useState<Group[]>([])
  const [showSelector, setShowSelector] = useState(false)
  const [postLimit, setPostLimit] = useState(10)
  const [mode, setMode] = useState<TaskMode>('recent_posts')
  const [postLimitError, setPostLimitError] = useState(false)

  const handleSubmit = () => {
    const limit = Number(postLimit)
    if (!limit || limit < 1) { setPostLimitError(true); return }
    setPostLimitError(false)
    const params: CreateTaskParams = { scope, mode, postLimit: limit }
    if (scope === 'selected') {
      if (selectedGroups.length === 0) return
      params.groupIds = selectedGroups.map((g) => g.vkGroupId)
    }
    onSubmit(params)
  }

  const removeGroup = (id: number) => {
    setSelectedGroups((prev) => prev.filter((g) => g.vkGroupId !== id))
  }

  return (
    <>
    <form className="mb-4 rounded-md border border-border bg-bg-panel p-4" onSubmit={(e) => { e.preventDefault(); handleSubmit() }}>
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1 block text-xs text-text-muted">Область</label>
          <div className="flex gap-1 rounded-md border border-border p-0.5">
            {SCOPE_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScope(s)}
                className={`rounded px-2.5 py-1 text-xs transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  scope === s
                    ? 'bg-accent text-text-on-accent'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {s === 'all' ? 'Все группы' : 'Выбранные группы'}
              </button>
            ))}
          </div>
        </div>
        {scope === 'selected' && (
          <div className="min-w-0 flex-1">
            <label className="mb-1 block text-xs text-text-muted">Группы</label>
            <div className="flex flex-wrap items-center gap-1.5">
              {selectedGroups.map((g) => (
                <span
                  key={g.vkGroupId}
                  className="inline-flex items-center gap-1 rounded bg-bg-hover px-1.5 py-0.5 text-xs text-text-secondary"
                >
                  {g.name || `#${g.vkGroupId}`}
                  <button
                    type="button"
                    onClick={() => removeGroup(g.vkGroupId)}
                    className="text-text-muted hover:text-text-primary transition-colors duration-150"
                    aria-label={`Убрать ${g.name ?? ''}`}
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
              <Button
                variant="secondary" size="xs" type="button"
                onClick={() => setShowSelector(true)}
                icon={<ListChecks size={12} />}
              >
                {selectedGroups.length > 0 ? 'Изменить' : 'Выбрать группы'}
              </Button>
            </div>
          </div>
        )}
        <div>
          <label htmlFor="task-post-limit" className="mb-1 block text-xs text-text-muted">Лимит постов</label>
          <Input
            id="task-post-limit"
            type="number"
            min={1}
            max={100}
            value={postLimit}
            onChange={(e) => { setPostLimit(Number(e.target.value)); setPostLimitError(false) }}
            aria-invalid={postLimitError || undefined}
            className="w-20"
          />
          {postLimitError && (
            <p className="mt-0.5 text-xs text-danger">Укажите число от 1 до 100</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-xs text-text-muted">Режим</label>
          <Select<string>
            value={MODE_LABELS[mode]}
            options={MODE_ITEMS.map(([, l]) => l)}
            onChange={(label) => {
              const found = MODE_ITEMS.find(([, l]) => l === label)
              if (found) setMode(found[0])
            }}
            label="Режим сбора"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="primary" size="xs" type="submit"
            disabled={isPending || (scope === 'selected' && selectedGroups.length === 0)}
            icon={isPending ? <Spinner size={12} /> : <Play size={12} />}
          >
            {isPending ? 'Создание...' : 'Создать'}
          </Button>
          <Button variant="ghost" size="xs" semantic="default" type="button" onClick={onCancel} icon={<X size={12} />}>
            Отмена
          </Button>
        </div>
      </div>
    </form>

      {showSelector && (
        <GroupSelectModal
          selectedGroups={selectedGroups}
          onConfirm={(groups) => {
            setSelectedGroups(groups)
            setShowSelector(false)
          }}
          onCancel={() => setShowSelector(false)}
        />
      )}
    </>)
}
