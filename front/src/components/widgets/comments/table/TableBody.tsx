import { CheckCircle, Flag, ExternalLink } from 'lucide-react'
import { Button, Checkbox } from '../../../ui'
import { StatusCell } from './StatusCell'
import type { Comment, Status } from '../../../../types/comments'

export type TableBodyProps = {
  rows: Comment[]
  selectedId: number | null
  focusedIndex: number
  selectedRows: Set<number>
  onSelect: (c: Comment) => void
  onToggleRow: (id: number) => void
  onStatusChange: (id: number, s: Status) => void
}

export function TableBody({ rows, selectedId, focusedIndex, selectedRows, onSelect, onToggleRow, onStatusChange }: TableBodyProps) {
  return (
    <tbody>
      {rows.map((c, i) => (
        <tr
          key={c.id} onClick={() => onSelect(c)}
          className={`cursor-pointer border-b border-border transition-colors duration-150 last:border-0 hover:bg-bg-hover ${selectedId === c.id ? 'bg-accent-soft' : ''} ${focusedIndex === i ? 'ring-2 ring-accent ring-inset' : ''}`}
          aria-selected={selectedId === c.id}
          tabIndex={-1}
        >
          <td className="px-3 py-2">
            <Checkbox
              checked={selectedRows.has(c.id)} onChange={() => onToggleRow(c.id)}
              onClick={(e) => e.stopPropagation()} aria-label={`Выбрать комментарий ${c.id}`}
            />
          </td>
          <td className="truncate px-3 py-2 text-text-primary">{c.text}</td>
          <td className="hidden px-3 py-2 text-text-secondary sm:table-cell truncate">{c.group}</td>
          <td className="hidden px-3 py-2 text-text-secondary sm:table-cell truncate">{c.author}</td>
          <td className="hidden px-3 py-2 text-text-secondary md:table-cell">{c.date}</td>
          <td className="px-3 py-2">
            <StatusCell status={c.status} onChange={(s) => onStatusChange(c.id, s)} />
          </td>
          <td className="px-3 py-2">
            <div className="flex items-center gap-1">
              <Button variant="icon" semantic="success" onClick={(e) => { e.stopPropagation(); onStatusChange(c.id, 'Чисто') }} aria-label="Отметить как чисто">
                <CheckCircle size={14} />
              </Button>
              <Button variant="icon" semantic="danger" onClick={(e) => { e.stopPropagation(); onStatusChange(c.id, 'Нарушение') }} aria-label="Отметить как нарушение">
                <Flag size={14} />
              </Button>
              <Button variant="icon" onClick={(e) => e.stopPropagation()} aria-label="Открыть пост в источнике">
                <ExternalLink size={14} />
              </Button>
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  )
}
