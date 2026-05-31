import { RotateCcw } from 'lucide-react'
import { Button } from '../../../ui'
import type { UndoEntry } from '../../../../types/comments'

export type UndoBarProps = {
  undo: UndoEntry
  onApply: () => void
}

export function UndoBar({ undo, onApply }: UndoBarProps) {
  return (
    <div className="mb-3 flex items-center gap-2 rounded-md border border-border bg-bg-panel px-3 py-2 text-xs animate-[fade-in_200ms_ease-out]">
      <span className="text-text-secondary">Статус изменён: {undo.from} → {undo.to}</span>
      <Button variant="ghost" size="xs" semantic="default" onClick={onApply} icon={<RotateCcw size={12} />}>Отменить</Button>
    </div>
  )
}
