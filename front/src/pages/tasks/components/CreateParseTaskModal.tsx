import { Play } from 'lucide-react'
import type { Group } from '@/shared/types'
import { useCreateParseTaskModal } from '@/pages/tasks/hooks/useCreateParseTaskModal'
import { FormModal } from '@/shared/components/common/FormModal'
import CreateParseTaskModalFooter from './CreateParseTaskModalFooter'
import CreateParseTaskModalGroupList from './CreateParseTaskModalGroupList'
import CreateParseTaskModalSearch from './CreateParseTaskModalSearch'
import CreateParseTaskModalSummary from './CreateParseTaskModalSummary'

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

  const handleSubmit = async (mode: 'recent_posts' | 'recheck_group') => {
    if (isLoading) {
      return
    }
    const ids = Array.from(selectedIds)
    try {
      await onSubmit({ groupIds: ids, mode })
      onClose()
    } catch {
      // Error handling is done by parent
    }
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="РЎРѕР·РґР°РЅРёРµ Р·Р°РґР°С‡Рё РЅР° РїР°СЂСЃРёРЅРі РіСЂСѓРїРї"
      description="РЎС„РѕСЂРјРёСЂСѓР№С‚Рµ СЃРїРёСЃРѕРє РіСЂСѓРїРї РґР»СЏ СЃР±РѕСЂР° РґР°РЅРЅС‹С…"
      icon={<Play className="h-5 w-5" />}
      isSaving={isLoading}
      widthClass="max-w-4xl"
    >
      <div className="space-y-4 pt-2">
        <CreateParseTaskModalSummary
          selectedCount={selectedIds.size}
          groupsCount={groups.length}
          filteredCount={filteredGroups.length}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
        />

        <CreateParseTaskModalSearch value={search} onChange={setSearch} />

        <CreateParseTaskModalGroupList
          groups={filteredGroups}
          selectedIds={selectedIds}
          getDisplayName={getDisplayName}
          onToggle={handleToggle}
        />

        <CreateParseTaskModalFooter
          isLoading={isLoading}
          selectedCount={selectedIds.size}
          onClose={onClose}
          onSubmit={handleSubmit}
        />
      </div>
    </FormModal>
  )
}

export default CreateParseTaskModal
