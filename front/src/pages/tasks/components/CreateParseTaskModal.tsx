import { useEffect, useState } from 'react'
import { Play } from 'lucide-react'
import type { Group } from '@/shared/types'
import { useCreateParseTaskModal } from '@/pages/tasks/hooks/useCreateParseTaskModal'
import CreateParseTaskModalFooter from './CreateParseTaskModalFooter'
import CreateParseTaskModalGroupList from './CreateParseTaskModalGroupList'
import CreateParseTaskModalSearch from './CreateParseTaskModalSearch'
import CreateParseTaskModalSummary from './CreateParseTaskModalSummary'
import TaskModalShell from './TaskModalShell'

type CreateParseTaskMode = 'recent_posts' | 'recheck_group'

interface CreateParseTaskModalProps {
  isOpen: boolean
  groups: Group[]
  isLoading: boolean
  onClose: () => void
  onSubmit: (payload: { groupIds: Array<number | string>; mode: CreateParseTaskMode }) => void
}

function CreateParseTaskModal({
  isOpen,
  groups,
  isLoading,
  onClose,
  onSubmit,
}: CreateParseTaskModalProps) {
  const [mode, setMode] = useState<CreateParseTaskMode>('recent_posts')
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
    if (!isOpen) {
      setMode('recent_posts')
    }
  }, [isOpen])

  const handleSubmit = async (submitMode: CreateParseTaskMode) => {
    if (isLoading || selectedIds.size === 0) {
      return
    }

    const ids = Array.from(selectedIds)
    try {
      await onSubmit({ groupIds: ids, mode: submitMode })
      onClose()
    } catch {
      // Error handling is done by parent
    }
  }

  return (
    <TaskModalShell
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title="Создание задачи парсинга"
      description="Выберите группы, режим обработки и запустите задачу."
      icon={<Play className="h-5 w-5" />}
      widthClass="max-w-6xl"
      footer={
        <CreateParseTaskModalFooter
          isLoading={isLoading}
          selectedCount={selectedIds.size}
          mode={mode}
          onClose={onClose}
          onSubmit={handleSubmit}
        />
      }
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="min-w-0 space-y-4">
          <CreateParseTaskModalSearch value={search} onChange={setSearch} />
          <CreateParseTaskModalGroupList
            groups={filteredGroups}
            selectedIds={selectedIds}
            getDisplayName={getDisplayName}
            onToggle={handleToggle}
          />
        </section>

        <CreateParseTaskModalSummary
          selectedCount={selectedIds.size}
          groupsCount={groups.length}
          filteredCount={filteredGroups.length}
          mode={mode}
          onModeChange={setMode}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
        />
      </div>
    </TaskModalShell>
  )
}

export default CreateParseTaskModal
