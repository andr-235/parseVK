import { Search, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Group } from '@/types'
import { useCreateParseTaskModal } from '@/modules/tasks/hooks/useCreateParseTaskModal'

interface CreateParseTaskModalProps {
  isOpen: boolean
  groups: Group[]
  isLoading: boolean
  onClose: () => void
  onSubmit: (groupIds: Array<number | string>) => void
}

function CreateParseTaskModal({ isOpen, groups, isLoading, onClose, onSubmit }: CreateParseTaskModalProps) {
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <div
        className="flex w-full max-h-[90vh] max-w-4xl flex-col overflow-hidden rounded-3xl bg-[#0F1115] text-white shadow-2xl ring-1 ring-white/10"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-parse-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <header className="flex items-start justify-between gap-4 px-8 py-6">
          <div className="space-y-1">
            <h2 id="create-parse-modal-title" className="text-2xl font-bold tracking-tight text-white">
              Создание задачи на парсинг групп
            </h2>
            <p className="text-sm text-gray-400">
              Сформируйте список групп с помощью поиска и быстрых действий. Мы сразу подсчитаем
              выбранные сообщества и подскажем, сколько осталось.
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
            onClick={onClose}
            aria-label="Закрыть модальное окно"
          >
            <X className="h-6 w-6" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-8 pb-6">
          {/* Stats & Actions */}
          <section className="mb-6 flex flex-col gap-4 rounded-2xl bg-[#181B21] p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="text-4xl font-bold text-white">{selectedIds.size}</span>
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Выбрано групп
                </span>
                <span className="text-sm text-gray-500">
                  из <span className="text-gray-300">{groups.length}</span> доступных • найдено{' '}
                  <span className="text-gray-300">{filteredGroups.length}</span>
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSelectAll}
                className="rounded-lg border border-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wide text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
              >
                Выбрать все
              </button>
              <button
                onClick={handleDeselectAll}
                className="rounded-lg border border-transparent px-4 py-2 text-xs font-bold uppercase tracking-wide text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
              >
                Снять выделение
              </button>
            </div>
          </section>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              className="w-full rounded-2xl border border-white/10 bg-[#131519] py-3.5 pl-12 pr-4 text-sm text-white placeholder-gray-500 transition-all focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
              placeholder="Поиск по названию, ссылке или ID"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <div className="mt-2 px-1 text-xs text-gray-500">
              Начните вводить название или идентификатор — список обновится мгновенно.
            </div>
          </div>

          {/* Group List */}
          <div className="flex flex-col gap-2">
            {filteredGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-12 text-center">
                <Search className="mb-3 h-8 w-8 text-gray-600" />
                <h3 className="text-base font-medium text-gray-300">Не нашли подходящих групп</h3>
                <p className="text-sm text-gray-500">Попробуйте изменить запрос или сбросить фильтры</p>
              </div>
            ) : (
              filteredGroups.map((group) => {
                const displayName = getDisplayName(group)
                const isChecked = selectedIds.has(group.id)

                return (
                  <div
                    key={group.id}
                    onClick={() => handleToggle(group.id)}
                    className={`group flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition-all hover:border-blue-500/30 hover:bg-[#1C1F26] ${
                      isChecked
                        ? 'border-blue-500/50 bg-[#1C1F26]'
                        : 'border-transparent bg-[#131519]'
                    }`}
                  >
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border transition-colors ${
                        isChecked
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-600 bg-transparent group-hover:border-blue-500'
                      }`}
                    >
                      {isChecked && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-200 group-hover:text-white">
                        {displayName}
                      </span>
                      {group.vkId ? (
                        <span className="text-xs text-gray-500">vk.com/club{group.vkId}</span>
                      ) : null}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="flex justify-end gap-3 border-t border-white/10 bg-[#131519]/50 px-8 py-6 backdrop-blur-sm">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="bg-[#1C1F26] text-white hover:bg-[#252932] border-transparent"
          >
            Отмена
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || selectedIds.size === 0}
            className="bg-blue-600 text-white hover:bg-blue-700 shadow-[0_0_20px_-5px_rgba(37,99,235,0.5)]"
          >
            {isLoading ? 'Создание...' : `Создать (${selectedIds.size})`}
          </Button>
        </footer>
      </div>
    </div>
  )
}

export default CreateParseTaskModal
