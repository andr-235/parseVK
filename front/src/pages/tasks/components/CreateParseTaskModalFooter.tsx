import { Button } from '@/shared/components/ui/button'

type CreateParseTaskMode = 'recent_posts' | 'recheck_group'

interface CreateParseTaskModalFooterProps {
  isLoading: boolean
  selectedCount: number
  mode: CreateParseTaskMode
  onClose: () => void
  onSubmit: (mode: CreateParseTaskMode) => void
}

function CreateParseTaskModalFooter({
  isLoading,
  selectedCount,
  mode,
  onClose,
  onSubmit,
}: CreateParseTaskModalFooterProps) {
  const actionLabel = mode === 'recheck_group' ? 'Создать перепроверку' : 'Создать парсинг постов'

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="font-monitoring-body text-sm text-text-secondary">
        {selectedCount > 0
          ? `Выбрано групп: ${selectedCount}`
          : 'Выберите хотя бы одну группу для запуска задачи'}
      </p>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onClose} className="h-10">
          Отмена
        </Button>
        <Button
          type="button"
          onClick={() => onSubmit(mode)}
          disabled={isLoading || selectedCount === 0}
          className="h-10 px-5"
        >
          {isLoading ? 'Создание...' : `${actionLabel} (${selectedCount})`}
        </Button>
      </div>
    </div>
  )
}

export default CreateParseTaskModalFooter
