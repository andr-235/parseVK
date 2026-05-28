import { Search, Check, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Group } from '@/types'
import { useCreateParseTaskModal } from '@/hooks/tasks/useCreateParseTaskModal'
import { FormModal } from '@/components/common/FormModal'

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

  const handleSubmit = (mode: 'recent_posts' | 'recheck_group') => {
    if (isLoading) {
      return
    }
    const ids = Array.from(selectedIds)
    onSubmit({ groupIds: ids, mode })
    onClose()
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Создание задачи на парсинг групп"
      description="Сформируйте список групп для сбора данных"
      icon={<Play className="h-5 w-5" />}
      isSaving={isLoading}
      widthClass="max-w-4xl"
    >
      <div className="space-y-4 pt-2">
        {/* Stats & Actions */}
        <section className="flex flex-col gap-4 rounded-2xl border border-border bg-background-primary/30 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="font-monitoring-display text-3xl font-semibold tracking-tight text-accent-primary">
              {selectedIds.size}
            </span>
            <div className="flex flex-col">
              <span className="font-monitoring-body text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
                Выбрано групп
              </span>
              <span className="font-monitoring-body text-xs font-normal text-text-secondary">
                из <span className="font-mono-accent text-xs font-medium text-text-light">{groups.length}</span> доступных • найдено{' '}
                <span className="font-mono-accent text-xs font-medium text-text-light">{filteredGroups.length}</span>
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSelectAll}
              type="button"
              className="rounded-lg border border-border bg-background-secondary/50 px-3 py-1.5 font-monitoring-body text-xs font-semibold uppercase tracking-wider text-text-secondary transition-all hover:bg-background-primary hover:text-text-light hover:border-accent-primary/50"
            >
              Выбрать все
            </button>
            <button
              onClick={handleDeselectAll}
              type="button"
              className="rounded-lg border border-transparent px-3 py-1.5 font-monitoring-body text-xs font-semibold uppercase tracking-wider text-text-secondary/70 transition-all hover:bg-background-primary hover:text-text-light"
            >
              Снять выделение
            </button>
          </div>
        </section>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            className="w-full rounded-xl border border-border bg-background-primary py-3 pl-12 pr-4 font-monitoring-body text-sm font-normal text-text-light placeholder:text-text-secondary focus:border-accent-primary/50 focus:outline-none focus:ring-2 focus:ring-accent-primary/10"
            placeholder="Поиск по названию, ссылке или ID"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {/* Group List */}
        <div className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto pr-1">
          {filteredGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-background-primary/30 py-10 text-center">
              <Search className="mb-2 h-6 w-6 text-text-secondary" />
              <h3 className="font-monitoring-body text-sm font-semibold text-text-light">
                Не нашли подходящих групп
              </h3>
              <p className="font-monitoring-body text-xs text-text-secondary">
                Попробуйте изменить запрос или сбросить поиск
              </p>
            </div>
          ) : (
            filteredGroups.map((group) => {
              const displayName = getDisplayName(group)
              const isChecked = selectedIds.has(group.id)

              return (
                <div
                  key={group.id}
                  onClick={() => handleToggle(group.id)}
                  className={`group flex cursor-pointer items-center gap-4 rounded-xl border p-3.5 transition-all duration-200 hover:border-accent-primary/30 hover:bg-background-primary/40 ${
                    isChecked
                      ? 'border-accent-primary/45 bg-accent-primary/5 text-text-light'
                      : 'border-border bg-background-primary/30'
                  }`}
                >
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all ${
                      isChecked
                        ? 'border-accent-primary bg-accent-primary'
                        : 'border-border bg-transparent group-hover:border-accent-primary'
                    }`}
                  >
                    {isChecked && (
                      <Check className="h-3.5 w-3.5 text-background-secondary" strokeWidth={3} />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-monitoring-body text-sm font-medium text-text-light">
                      {displayName}
                    </span>
                    {group.vkId ? (
                      <span className="font-mono-accent text-xs text-text-secondary">
                        vk.com/club{group.vkId}
                      </span>
                    ) : null}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-border pt-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-10 border-border bg-transparent text-text-secondary hover:bg-background-primary hover:text-text-light transition-all"
          >
            Отмена
          </Button>
          <Button
            type="button"
            onClick={() => handleSubmit('recent_posts')}
            disabled={isLoading || selectedIds.size === 0}
            className="h-10 border border-border bg-background-secondary hover:bg-background-primary text-text-primary transition-all px-4"
          >
            {isLoading ? 'Создание...' : `Парсить последние посты (${selectedIds.size})`}
          </Button>
          <Button
            type="button"
            onClick={() => handleSubmit('recheck_group')}
            disabled={isLoading || selectedIds.size === 0}
            className="h-10 bg-accent-primary text-text-light hover:bg-accent-primary/95 transition-all px-4"
          >
            {isLoading ? 'Создание...' : `Перепроверить группу (${selectedIds.size})`}
          </Button>
        </div>
      </div>
    </FormModal>
  )
}

export default CreateParseTaskModal
