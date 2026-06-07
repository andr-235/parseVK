import { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, X, Building2, Check } from 'lucide-react'
import { Button, Input, Checkbox, Spinner } from '../../../components/ui'
import { fetchGroups } from '../../../shared/api/groups'
import type { Group } from '../../../shared/api/groups'
import { useDebounce } from '../../../shared/hooks/useDebounce'

const PAGE_SIZE = 20

export type GroupSelectModalProps = {
  selectedGroups: Group[]
  onConfirm: (groups: Group[]) => void
  onCancel: () => void
}

export function GroupSelectModal({ selectedGroups, onConfirm, onCancel }: GroupSelectModalProps) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Map<number, Group>>(
    () => new Map(selectedGroups.map((g) => [g.vkGroupId, g])),
  )
  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['groups', 'modal', { search: debouncedSearch, page, limit: PAGE_SIZE }],
    queryFn: () => fetchGroups({ search: debouncedSearch || undefined, page, limit: PAGE_SIZE }),
  })

  const handleConfirm = useCallback(() => {
    onConfirm(Array.from(selected.values()))
  }, [selected, onConfirm])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
      else if (e.key === 'Enter' && selected.size > 0) handleConfirm()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selected, onCancel, handleConfirm])

  const groups = data?.items ?? []
  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0

  const toggleGroup = (group: Group) => {
    setSelected((prev) => {
      const next = new Map(prev)
      if (next.has(group.vkGroupId)) {
        next.delete(group.vkGroupId)
      } else {
        next.set(group.vkGroupId, group)
      }
      return next
    })
  }

  const isAllOnPage = groups.length > 0 && groups.every((g) => selected.has(g.vkGroupId))

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Map(prev)
      if (isAllOnPage) {
        groups.forEach((g) => next.delete(g.vkGroupId))
      } else {
        groups.forEach((g) => {
          if (!next.has(g.vkGroupId)) next.set(g.vkGroupId, g)
        })
      }
      return next
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
      role="dialog"
      aria-modal="true"
      aria-label="Выбор групп"
    >
      <div className="mx-4 flex max-h-[80vh] w-full max-w-lg flex-col rounded-lg border border-border bg-bg-elevated">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-text-primary">Выбор групп</h2>
          <Button variant="ghost" size="xs" semantic="default" type="button" onClick={onCancel} aria-label="Закрыть">
            <X size={14} />
          </Button>
        </div>

        <div className="border-b border-border px-4 py-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <Input
              autoFocus
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Поиск групп..."
              aria-label="Поиск групп"
              className="pl-8"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size={20} />
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-2 py-12 text-sm text-danger">
              <p>Ошибка загрузки групп</p>
              <Button variant="secondary" size="xs" semantic="default" type="button" onClick={onCancel}>
                Закрыть
              </Button>
            </div>
          ) : groups.length === 0 ? (
            <p className="py-12 text-center text-sm text-text-muted">
              {search ? 'Ничего не найдено' : 'Нет групп'}
            </p>
          ) : (
            <>
              <div className="flex items-center gap-2 border-b border-border px-4 py-1.5">
                <Checkbox
                  checked={isAllOnPage}
                  onChange={toggleAll}
                  aria-label="Выбрать все на странице"
                />
                <span className="text-xs text-text-muted">
                  {data ? `${data.total} групп` : ''}
                </span>
              </div>
              {groups.map((group) => {
                const sel = selected.has(group.vkGroupId)
                return (
                  <div
                    key={group.vkGroupId}
                    className={`flex cursor-pointer items-center gap-3 px-4 py-2 transition-colors duration-150 ${
                      sel ? 'bg-accent-soft' : 'hover:bg-bg-hover'
                    }`}
                    onClick={() => toggleGroup(group)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleGroup(group) } }}
                    role="option"
                    aria-selected={sel}
                    tabIndex={0}
                  >
                    <Checkbox
                      checked={sel}
                      onChange={() => toggleGroup(group)}
                      aria-label={group.name ?? `Группа #${group.vkGroupId}`}
                    />
                    {group.photo50 ? (
                      <img src={group.photo50} alt="" className="h-8 w-8 rounded object-cover" loading="lazy" />
                    ) : (
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded bg-bg-hover text-text-muted">
                        <Building2 size={14} />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text-primary">
                        {group.name || `Группа #${group.vkGroupId}`}
                      </p>
                      {group.screenName && (
                        <p className="truncate text-xs text-text-muted">@{group.screenName}</p>
                      )}
                    </div>
                    {sel && (
                      <Check size={14} className="text-accent shrink-0" />
                    )}
                  </div>
                )
              })}
            </>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <span className="text-xs text-text-muted">
            {selected.size > 0
              ? `Выбрано ${selected.size} ${selected.size === 1 ? 'группа' : selected.size < 5 ? 'группы' : 'групп'}`
              : 'Ничего не выбрано'}
          </span>
          <div className="flex items-center gap-2">
            {totalPages > 1 && (
              <div className="flex items-center gap-1 text-xs text-text-muted">
                <Button variant="ghost" size="xs" semantic="default" type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                  Назад
                </Button>
                <span className="px-1">{page} / {totalPages}</span>
                <Button variant="ghost" size="xs" semantic="default" type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  Вперёд
                </Button>
              </div>
            )}
            <Button variant="ghost" size="xs" semantic="default" type="button" onClick={onCancel}>
              Отмена
            </Button>
            <Button variant="primary" size="xs" type="button" onClick={handleConfirm} disabled={selected.size === 0}>
              Подтвердить
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
