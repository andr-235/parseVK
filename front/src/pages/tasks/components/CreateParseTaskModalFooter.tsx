import { Button } from '@/shared/components/ui/button'

type CreateParseTaskMode = 'recent_posts' | 'recheck_group'

interface CreateParseTaskModalFooterProps {
  isLoading: boolean
  selectedCount: number
  onClose: () => void
  onSubmit: (mode: CreateParseTaskMode) => void
}

function CreateParseTaskModalFooter({
  isLoading,
  selectedCount,
  onClose,
  onSubmit,
}: CreateParseTaskModalFooterProps) {
  return (
    <div className="flex justify-end gap-3 border-t border-border pt-4 mt-6">
      <Button
        type="button"
        variant="outline"
        onClick={onClose}
        className="h-10 border-border bg-transparent text-text-secondary hover:bg-background-primary hover:text-text-light transition-all"
      >
        РћС‚РјРµРЅР°
      </Button>
      <Button
        type="button"
        onClick={() => onSubmit('recent_posts')}
        disabled={isLoading || selectedCount === 0}
        className="h-10 border border-border bg-background-secondary hover:bg-background-primary text-text-primary transition-all px-4"
      >
        {isLoading
          ? 'РЎРѕР·РґР°РЅРёРµ...'
          : `РџР°СЂСЃРёС‚СЊ РїРѕСЃР»РµРґРЅРёРµ РїРѕСЃС‚С‹ (${selectedCount})`}
      </Button>
      <Button
        type="button"
        onClick={() => onSubmit('recheck_group')}
        disabled={isLoading || selectedCount === 0}
        className="h-10 bg-accent-primary text-text-light hover:bg-accent-primary/95 transition-all px-4"
      >
        {isLoading
          ? 'РЎРѕР·РґР°РЅРёРµ...'
          : `РџРµСЂРµРїСЂРѕРІРµСЂРёС‚СЊ РіСЂСѓРїРїСѓ (${selectedCount})`}
      </Button>
    </div>
  )
}

export default CreateParseTaskModalFooter
