import { X } from 'lucide-react'
import { Button } from '../../../components/ui'

type AddAuthorFormProps = {
  expanded: boolean
  addVkId: string
  setAddVkId: (v: string) => void
  onSubmit: (e: React.FormEvent) => void
  error: string | null
  isSubmitting: boolean
  onClose: () => void
}

export function AddAuthorForm({
  expanded,
  addVkId,
  setAddVkId,
  onSubmit,
  error,
  isSubmitting,
  onClose
}: AddAuthorFormProps) {
  if (!expanded) return null
  return (
    <form onSubmit={onSubmit} className="mt-2 p-2 border border-border rounded bg-bg-main flex flex-col gap-2 animate-fade-in">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">Новый автор VK</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть форму добавления автора"
          className="text-text-muted hover:text-text-primary focus-visible:ring-2 focus-visible:ring-accent focus:outline-none rounded-sm p-1.5 -mr-1.5"
        >
          <X size={12} />
        </button>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Например, 123456"
          value={addVkId}
          onChange={(e) => setAddVkId(e.target.value)}
          aria-label="Ввод VK ID автора"
          className="flex-1 px-2 py-1 text-xs rounded border border-border bg-bg-panel text-text-primary focus:outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent"
        />
        <Button
          variant="primary"
          size="xs"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? '...' : 'ОК'}
        </Button>
      </div>
      {error && <p className="text-[10px] text-danger">{error}</p>}
    </form>
  )
}
