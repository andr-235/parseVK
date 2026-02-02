import { Search, X, Check } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import type { Group } from '@/types'
import { useCreateParseTaskModal } from '@/modules/tasks/hooks/useCreateParseTaskModal'

interface CreateParseTaskModalProps {
  isOpen: boolean
  groups: Group[]
  isLoading: boolean
  onClose: () => void
  onSubmit: (groupIds: Array<number | string>) => void
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md transition-opacity animate-in fade-in-0 duration-300"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-h-[90vh] max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900/95 backdrop-blur-2xl text-white shadow-2xl animate-in zoom-in-95 fade-in-0 duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-parse-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Top Glow */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        {/* Header */}
        <header className="flex items-start justify-between gap-4 border-b border-white/10 px-8 py-6">
          <div className="space-y-1">
            <h2
              id="create-parse-modal-title"
              className="font-monitoring-display text-2xl font-bold tracking-tight text-white"
            >
              Создание задачи на парсинг групп
            </h2>
            <p className="text-sm text-slate-400">
              Сформируйте список групп с помощью поиска и быстрых действий. Мы сразу подсчитаем
              выбранные сообщества и подскажем, сколько осталось.
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
            onClick={onClose}
            aria-label="Закрыть модальное окно"
          >
            <X className="h-6 w-6" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-8 pb-6">
          {/* Stats & Actions */}
          <section className="mb-6 flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-800/30 p-6 sm:flex-row sm:items-center sm:justify-between backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <span className="text-4xl font-bold text-cyan-400 font-monitoring-display">
                {selectedIds.size}
              </span>
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono-accent">
                  Выбрано групп
                </span>
                <span className="text-sm text-slate-400">
                  из <span className="text-white font-medium">{groups.length}</span> доступных •
                  найдено <span className="text-white font-medium">{filteredGroups.length}</span>
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSelectAll}
                className="rounded-lg border border-white/10 bg-slate-800/50 px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-300 transition-all hover:bg-white/5 hover:text-white hover:border-cyan-400/50"
              >
                Выбрать все
              </button>
              <button
                onClick={handleDeselectAll}
                className="rounded-lg border border-transparent px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-400 transition-all hover:bg-white/5 hover:text-white"
              >
                Снять выделение
              </button>
            </div>
          </section>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              className="w-full rounded-xl border border-white/10 bg-slate-800/50 py-3.5 pl-12 pr-4 text-sm text-white placeholder:text-slate-500 transition-all focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
              placeholder="Поиск по названию, ссылке или ID"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <div className="mt-2 px-1 text-xs text-slate-500">
              Начните вводить название или идентификатор — список обновится мгновенно.
            </div>
          </div>

          {/* Group List */}
          <div className="flex flex-col gap-2">
            {filteredGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-slate-800/30 py-12 text-center">
                <Search className="mb-3 h-8 w-8 text-slate-500" />
                <h3 className="font-monitoring-display text-base font-medium text-white">
                  Не нашли подходящих групп
                </h3>
                <p className="text-sm text-slate-400">
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
                    className={`group flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-all duration-200 hover:border-cyan-400/30 hover:bg-white/5 animate-in fade-in-0 slide-in-from-left-2 ${
                      isChecked
                        ? 'border-cyan-400/40 bg-cyan-500/10'
                        : 'border-white/10 bg-slate-800/30'
                    }`}
                    style={{ animationDelay: `${index * 20}ms`, animationDuration: '300ms' }}
                  >
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all ${
                        isChecked
                          ? 'border-cyan-400 bg-cyan-400'
                          : 'border-white/30 bg-transparent group-hover:border-cyan-400'
                      }`}
                    >
                      {isChecked && (
                        <Check className="h-3.5 w-3.5 text-slate-900" strokeWidth={3} />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-white">{displayName}</span>
                      {group.vkId ? (
                        <span className="text-xs text-slate-400 font-mono-accent">
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
        <footer className="flex justify-end gap-3 border-t border-white/10 bg-slate-800/50 px-8 py-6 backdrop-blur-sm">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="h-11 text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            Отмена
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || selectedIds.size === 0}
            className="group relative h-11 overflow-hidden bg-gradient-to-r from-cyan-500 to-blue-500 font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <span className="relative">
              {isLoading ? 'Создание...' : `Создать (${selectedIds.size})`}
            </span>
          </Button>
        </footer>

        {/* Bottom Glow */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500" />
      </div>
    </div>
  )
}

export default CreateParseTaskModal
