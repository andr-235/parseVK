import { useEffect, useMemo, useState } from 'react'
import { Button } from './ui/button'
import type { Group } from '../types'

interface CreateParseTaskModalProps {
  isOpen: boolean
  groups: Group[]
  isLoading: boolean
  onClose: () => void
  onSubmit: (groupIds: Array<number | string>) => void
}

const getDisplayName = (group: Group): string => {
  if (group.name && group.name.trim() !== '') {
    return group.name
  }

  if (group.screenName && group.screenName.trim() !== '') {
    return group.screenName
  }

  if (typeof group.vkId === 'number') {
    return 'Группа ' + group.vkId
  }

  return 'Группа ' + group.id
}

function CreateParseTaskModal({ isOpen, groups, isLoading, onClose, onSubmit }: CreateParseTaskModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set())
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!isOpen) {
      setSelectedIds(new Set())
      setSearch('')
      return
    }

    setSelectedIds(new Set(groups.map((group) => group.id)))
  }, [isOpen, groups])

  const filteredGroups = useMemo(() => {
    if (!search.trim()) {
      return groups
    }

    const normalized = search.toLowerCase()
    return groups.filter((group) => {
      const display = getDisplayName(group).toLowerCase()
      const vkId = group.vkId ? String(group.vkId) : ''
      const id = String(group.id)
      return display.includes(normalized) || vkId.includes(normalized) || id.includes(normalized)
    })
  }, [groups, search])

  const handleToggle = (groupId: number | string) => {
    setSelectedIds((prev) => {
      const updated = new Set(prev)
      if (updated.has(groupId)) {
        updated.delete(groupId)
      } else {
        updated.add(groupId)
      }
      return updated
    })
  }

  const handleSelectAll = () => {
    setSelectedIds(new Set(groups.map((group) => group.id)))
  }

  const handleDeselectAll = () => {
    setSelectedIds(new Set())
  }

  const handleSubmit = () => {
    if (isLoading) {
      return
    }
    const ids = Array.from(selectedIds)
    onSubmit(ids)
    onClose()
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
        className="flex w-full max-h-[90vh] max-w-4xl flex-col overflow-hidden rounded-3xl bg-background-secondary text-text-primary shadow-soft-lg transition-colors duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-parse-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-border px-8 py-6">
          <div className="space-y-2">
            <h2 id="create-parse-modal-title" className="text-2xl font-semibold tracking-tight">
              Создание задачи на парсинг групп
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-text-secondary">
              Сформируйте список групп с помощью поиска и быстрых действий. Мы сразу подсчитаем выбранные
              сообщества и подскажем, сколько осталось.
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

        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">
          <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div
              className="flex flex-1 items-center gap-4 rounded-2xl border border-border bg-background-primary/40 p-4 shadow-soft-sm"
              role="status"
              aria-live="polite"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-primary/10 text-2xl font-bold text-accent-primary">
                {selectedIds.size}
              </div>
              <div className="space-y-1">
                <span className="text-sm font-semibold uppercase tracking-wide text-text-secondary">Выбрано групп</span> 
                <span className="text-sm text-text-secondary">
                  из {groups.length} доступных • найдено {filteredGroups.length}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="inline-flex items-center rounded-full border border-border bg-background-primary/30 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-text-secondary transition-colors duration-200 hover:bg-background-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50"
                onClick={handleSelectAll}
              >
                Выбрать все
              </button>
              <button
                type="button"
                className="inline-flex items-center rounded-full border border-transparent bg-background-secondary/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-text-secondary transition-colors duration-200 hover:bg-background-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50"
                onClick={handleDeselectAll}
              >
                Снять выделение
              </button>
            </div>
          </section>

          <section className="space-y-4">
            <div className="rounded-2xl border border-border bg-background-primary/40 p-4 shadow-soft-sm">
              <div className="relative flex items-center">
                <span className="pointer-events-none absolute left-4 text-lg" aria-hidden="true">🔍</span>
                <input
                  type="text"
                  className="w-full rounded-2xl border border-border bg-background-primary pl-11 pr-4 py-3 text-sm text-text-primary shadow-soft-sm transition-colors duration-200 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/40"
                  placeholder="Поиск по названию, ссылке или ID"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <p className="mt-3 text-sm text-text-secondary">
                Начните вводить название или идентификатор — список обновится мгновенно.
              </p>
            </div>

            <div className="max-h-[380px] space-y-3 overflow-y-auto pr-1">
              {filteredGroups.length === 0 ? (
                <div className="space-y-3 rounded-2xl border border-dashed border-border/70 bg-background-primary/40 p-8 text-center text-sm text-text-secondary">
                  <h3 className="text-base font-semibold text-text-primary">Не нашли подходящих групп</h3>
                  <p>Попробуйте изменить запрос или сбросить фильтры выбора.</p>
                </div>
              ) : (
                filteredGroups.map((group) => {
                  const displayName = getDisplayName(group)
                  const isChecked = selectedIds.has(group.id)

                  return (
                    <label
                      key={group.id}
                      className={`flex items-start gap-3 rounded-2xl border p-4 transition-colors duration-200 ${
                        isChecked
                          ? 'border-accent-primary bg-background-primary/50 shadow-soft-sm'
                          : 'border-transparent bg-background-primary/30 hover:border-accent-primary/40'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggle(group.id)}
                        className="mt-1 h-5 w-5 cursor-pointer rounded-md border border-border accent-accent-primary"
                      />
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-semibold text-text-primary">{displayName}</span>
                        {group.vkId ? (
                          <span className="text-xs text-text-secondary">{'vk.com/club' + group.vkId}</span>
                        ) : null}
                      </div>
                    </label>
                  )
                })
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
            onClick={handleSubmit}
            disabled={isLoading || selectedIds.size === 0}
            className="w-full sm:w-auto"
          >
            {isLoading ? 'Создание...' : `Создать (${selectedIds.size})`}
          </Button>
        </footer>
      </div>
    </div>
  )
}

export default CreateParseTaskModal
