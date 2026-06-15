import { CheckCircle, Flag, HelpCircle, Circle } from 'lucide-react'
import type { Status } from '../../../types/comments'

const LEGEND: { label: Status; Icon: typeof CheckCircle }[] = [
  { label: 'Чисто', Icon: CheckCircle },
  { label: 'Нарушение', Icon: Flag },
  { label: 'Проверка', Icon: HelpCircle },
  { label: 'Новый', Icon: Circle },
]

export function StatusLegend() {
  return (
    <div className="mt-2 flex items-center gap-3 text-xs text-text-muted">
      {LEGEND.map(({ label, Icon }) => (
        <span key={label} className="flex items-center gap-1">
          <Icon size={12} /> {label}
        </span>
      ))}
      <span className="ml-auto text-text-muted">↑↓ навигация · C чисто · V нарушение · R проверка</span>
    </div>
  )
}
