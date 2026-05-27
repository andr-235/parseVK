import { useEffect } from 'react'
import { Search, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Group } from '@/types'
import { useCreateParseTaskModal } from '@/hooks/tasks/useCreateParseTaskModal'

interface CreateParseTaskModalProps {
  isOpen: boolean
  groups: Group[]
  isLoading: boolean
  onClose: () => void
  onSubmit: (payload: {
    groupIds: Array<number | string>
    mode: 'recent_posts' | 'recheck_group'
  }) => void
}

function CreateParseTaskModal({
  isOpen,
  groups,
  isLoading,
  onClose,
  onSubmit,
}: CreateParseTaskModalProps) {
  const {
    selectedIds,
    search,
    setSearch,
    filteredGroups,
    handleToggle,
    handleSelectAll,
    handleDeselectAll,
    getDisplayName,
  } = useCreateParseTaskModal(groups, isOpen)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const handleSubmit = (mode: 'recent_posts' | 'recheck_group') => {
    if (isLoading) {
      return
    }
    const ids = Array.from(selectedIds)
    onSubmit({ groupIds: ids, mode })
    onClose()
  }

  if (!isOpen) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 transition-opacity animate-in fade-in-0 duration-300"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-h-[90vh] max-w-4xl flex-col overflow-hidden rounded-2xl border border-border/60 bg-background-secondary text-white shadow-soft-lg animate-in zoom-in-95 fade-in-0 duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-parse-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <header className="flex items-start justify-between gap-4 border-b border-border/60 px-8 py-6">
          <div className="space-y-1">
            <h2
              id="create-parse-modal-title"
              className="font-monitoring-display text-xl font-semibold tracking-tight text-white"
            >
              Создание задачи на парсинг групп
            </h2>
            <p className="font-monitoring-body text-sm font-normal text-text-secondary">
              Сформируйте список групп с помощью поиска и быстрых действий. Мы сразу подсчитаем
              выбранные сообщества и подскажем, сколько осталось.
            </p>
            <p className="font-monitoring-body text-xs font-semibold uppercase tracking-wider text-accent-info/80">
              Выберите действие: обычный парсинг или полная перепроверка группы
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-background-primary/40 hover:text-white"
            onClick={onClose}
            aria-label="Закрыть модальное окно"
          >
            <X className="h-6 w-6" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-8 pb-6">
          {/* Stats & Actions */}
          <section className="mb-6 flex flex-col gap-4 rounded-2xl border border-border/60 bg-background-primary/30 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="font-monitoring-display text-3xl font-semibold tracking-tight text-accent-info">
                {selectedIds.size}
              </span>
              <div className="flex flex-col">
                <span className="font-monitoring-body text-xs font-semibold uppercase tracking-wider text-text-secondary/70">
                  Выбрано групп
                </span>
                <span className="font-monitoring-body text-sm font-normal text-text-secondary">
                  из{' '}
                  <span className="font-mono-accent text-xs font-medium text-text-primary">
                    {groups.length}
                  </span>{' '}
                  доступных • найдено{' '}
                  <span className="font-mono-accent text-xs font-medium text-text-primary">
                    {filteredGroups.length}
                  </span>
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSelectAll}
                className="rounded-lg border border-border/60 bg-background-secondary/50 px-4 py-2 font-monitoring-body text-xs font-semibold uppercase tracking-wider text-text-secondary transition-all hover:bg-background-primary/40 hover:text-white hover:border-accent-info/50"
              >
                Выбрать все
              </button>
              <button
                onClick={handleDeselectAll}
                className="rounded-lg border border-transparent px-4 py-2 font-monitoring-body text-xs font-semibold uppercase tracking-wider text-text-secondary/70 transition-all hover:bg-background-primary/40 hover:text-white"
              >
                Снять выделение
              </button>
            </div>
          </section>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              className="w-full rounded-xl border border-border/60 bg-background-primary/50 py-3.5 pl-12 pr-4 font-monitoring-body text-sm font-normal text-text-primary placeholder:text-text-secondary/50 transition-all focus:border-accent-info/50 focus:outline-none focus:ring-2 focus:ring-accent-info/20"
              placeholder="Поиск по названию, ссылке или ID"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <div className="mt-2 px-1 font-monitoring-body text-xs font-normal text-text-secondary">
              Начните вводить название или идентификатор — список обновится мгновенно.
            </div>
          </div>

          {/* Group List */}
          <div className="flex flex-col gap-2">
            {filteredGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-background-primary/30 py-12 text-center">
                <Search className="mb-3 h-8 w-8 text-text-secondary" />
                <h3 className="font-monitoring-body text-base font-semibold text-white">
                  Не нашли подходящих групп
                </h3>
                <p className="font-monitoring-body text-sm font-normal text-text-secondary">
                  Попробуйте изменить запрос или сбросить фильтры
                </p>
              </div>
            ) : (
              filteredGroups.map((group, index) => {
                const displayName = getDisplayName(group)
                const isChecked = selectedIds.has(group.id)

                return (
                  <div
                    key={group.id}
                    onClick={() => handleToggle(group.id)}
                    className={`group flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-all duration-200 hover:border-accent-info/30 hover:bg-background-primary/40 animate-in fade-in-0 slide-in-from-left-2 ${
                      isChecked
                        ? 'border-accent-info/40 bg-accent-info/10'
                        : 'border-border/60 bg-background-primary/30'
                    }`}
                    style={{ animationDelay: `${index * 20}ms`, animationDuration: '300ms' }}
                  >
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all ${
                        isChecked
                          ? 'border-accent-info bg-accent-info'
                          : 'border-border/60 bg-transparent group-hover:border-accent-info'
                      }`}
                    >
                      {isChecked && (
                        <Check className="h-3.5 w-3.5 text-background-secondary" strokeWidth={3} />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-monitoring-body text-sm font-normal text-white">
                        {displayName}
                      </span>
                      {group.vkId ? (
                        <span className="font-mono-accent text-xs font-medium text-text-secondary">
                          vk.com/club{group.vkId}
                        </span>
                      ) : null}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="flex justify-end gap-3 border-t border-border/60 bg-background-secondary/90 px-8 py-6">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="h-11 text-text-secondary hover:text-white hover:bg-background-primary/40 transition-colors"
          >
            Отмена
          </Button>
          <Button
            type="button"
            onClick={() => handleSubmit('recent_posts')}
            disabled={isLoading || selectedIds.size === 0}
            className="group relative h-11 overflow-hidden border border-border/60 bg-background-secondary/70 font-semibold text-text-primary transition-all duration-300 hover:bg-background-primary/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="relative">
              {isLoading ? 'Создание...' : `Парсить последние посты (${selectedIds.size})`}
            </span>
          </Button>
          <Button
            type="button"
            onClick={() => handleSubmit('recheck_group')}
            disabled={isLoading || selectedIds.size === 0}
            className="group relative h-11 overflow-hidden bg-accent-primary font-semibold text-text-light shadow-soft-sm transition-all duration-300 hover:bg-accent-primary/90 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="relative">
              {isLoading ? 'Создание...' : `Перепроверить группу (${selectedIds.size})`}
            </span>
          </Button>
        </footer>
      </div>
    </div>
  )
}

export default CreateParseTaskModal
