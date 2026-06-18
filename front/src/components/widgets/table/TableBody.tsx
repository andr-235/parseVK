import { memo } from 'react'
import { CheckCircle, Flag, ExternalLink, Pencil } from 'lucide-react'
import { Button, Checkbox } from '../../ui'
import { StatusCell } from './StatusCell'
import type { Comment, Status } from '../../../types/comments'

export type TableBodyProps = {
  rows: Comment[]
  selectedId: number | null
  focusedIndex: number
  selectedRows: Set<number>
  onSelect: (c: Comment) => void
  onToggleRow: (id: number) => void
  onStatusChange: (id: number, s: Status) => void
  onAddToWatchlist?: (commentId: number) => void
}

export const TableBody = memo(function TableBody({ rows, selectedId, focusedIndex, selectedRows, onSelect, onToggleRow, onStatusChange, onAddToWatchlist }: TableBodyProps) {
  return (
    <tbody>
      {rows.map((c, i) => (
        <tr
          key={c.id} onClick={() => onSelect(c)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(c) } }}
          className={`cursor-pointer border-b border-border transition-colors duration-150 last:border-0 hover:bg-bg-hover ${selectedId === c.id ? 'bg-accent-soft' : ''} ${focusedIndex === i ? 'ring-2 ring-accent ring-inset' : ''}`}
          aria-selected={selectedId === c.id}
        >
          <td className="px-3 py-2">
            <Checkbox
              checked={selectedRows.has(c.id)} onChange={() => onToggleRow(c.id)}
              onClick={(e) => e.stopPropagation()} aria-label={`Выбрать комментарий ${c.id}`}
            />
          </td>
          <td className="break-words whitespace-normal px-3 py-2 text-text-primary">{c.text}</td>
          <td className="hidden px-3 py-2 sm:table-cell">
            {c.groupUrl ? (
              <a href={c.groupUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-2 text-text-secondary underline decoration-transparent hover:decoration-text-secondary transition-colors duration-150">
                {c.groupAvatar && (
                  <img src={c.groupAvatar} alt="" className="size-6 shrink-0 rounded-full" loading="lazy" />
                )}
                <div className="truncate">
                  <div className="truncate">{c.group}</div>
                  {c.groupScreenName && <div className="truncate text-[11px] text-text-muted">@{c.groupScreenName}</div>}
                </div>
              </a>
            ) : (
              <span className="flex items-center gap-2 text-text-secondary">
                {c.groupAvatar && (
                  <img src={c.groupAvatar} alt="" className="size-6 shrink-0 rounded-full" loading="lazy" />
                )}
                <span className="truncate">{c.group}</span>
              </span>
            )}
          </td>
          <td className="hidden px-3 py-2 sm:table-cell">
            {c.authorUrl ? (
              <a href={c.authorUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-2 text-text-secondary underline decoration-transparent hover:decoration-text-secondary transition-colors duration-150">
                {c.authorAvatar && (
                  <img src={c.authorAvatar} alt="" className="size-6 shrink-0 rounded-full" loading="lazy" />
                )}
                <div className="truncate">
                  <div className="truncate">{c.author}</div>
                  {c.authorScreenName && <div className="truncate text-[11px] text-text-muted">@{c.authorScreenName}</div>}
                </div>
              </a>
            ) : (
              <span className="flex items-center gap-2 text-text-secondary">
                {c.authorAvatar && (
                  <img src={c.authorAvatar} alt="" className="size-6 shrink-0 rounded-full" loading="lazy" />
                )}
                <span className="truncate">{c.author}</span>
              </span>
            )}
          </td>
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
              {onAddToWatchlist && (
                <Button
                  variant="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    onAddToWatchlist(c.id)
                  }}
                  aria-label="Взять автора на карандаш"
                  title="Взять автора на карандаш"
                >
                  <Pencil size={14} />
                </Button>
              )}
              <Button variant="icon" onClick={(e) => e.stopPropagation()} aria-label="Открыть post в источнике">
                <ExternalLink size={14} />
              </Button>
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  )
})
