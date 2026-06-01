import { CheckCircle, Flag, HelpCircle, X } from 'lucide-react'
import { Button } from '../../ui'
import { STATUS_ACTIONS } from './constants'

const ICONS: Record<string, React.ReactNode> = {
  Чисто: <CheckCircle size={12} />,
  Нарушение: <Flag size={12} />,
  Проверка: <HelpCircle size={12} />,
}

export type BatchActionBarProps = {
  count: number
  onChange: (status: string) => void
  onClear: () => void
}

export function BatchActionBar({ count, onChange, onClear }: BatchActionBarProps) {
  return (
    <div className="mb-3 flex items-center gap-2 rounded-md border border-border bg-bg-panel px-3 py-2 text-xs" role="toolbar" aria-label="Действия с выбранными">
      <span className="text-text-muted mr-1">{count} выбрано:</span>
      {STATUS_ACTIONS.map((a) => (
        <Button key={a.semantic} variant="soft" semantic={a.semantic} size="xs" onClick={() => onChange(a.label)} icon={ICONS[a.label]}>
          {a.label}
        </Button>
      ))}
      <div className="ml-auto">
        <Button variant="ghost" size="xs" semantic="default" onClick={onClear} icon={<X size={12} />}>Снять</Button>
      </div>
    </div>
  )
}
