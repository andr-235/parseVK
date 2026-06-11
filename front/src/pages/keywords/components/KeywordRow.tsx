import { memo, useState, useCallback } from 'react'
import { ChevronRight, ChevronDown, Hash, Trash2, AlertTriangle } from 'lucide-react'
import { Button, Checkbox, ConfirmAction } from '../../../components/ui'
import { FormsExpand } from './FormsExpand'
import type { Keyword } from '../../../shared/api/keywords'

export type ActionState = {
  deleting: number | null
  confirmDelete: number | null
}

type Props = {
  keyword: Keyword
  checked: boolean
  actionState: ActionState
  isFocused: boolean
  onDelete: (id: number) => void
  onConfirmDelete: (id: number) => void
  onCancelDelete: () => void
  onToggle: (id: number) => void
}

export const KeywordRow = memo(function KeywordRow({
  keyword,
  checked,
  actionState,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
  onToggle,
  isFocused,
}: Props) {
  const [expanded, setExpanded] = useState(false)
  const isDeleting = actionState.deleting === keyword.id
  const isConfirmingDelete = actionState.confirmDelete === keyword.id

  const toggleExpand = useCallback(() => setExpanded((v) => !v), [])

  return (
    <>
      <tr className={`border-b border-border last:border-0 transition-colors duration-150 ${
        isFocused
          ? 'bg-bg-hover ring-1 ring-inset ring-accent/20'
          : 'hover:bg-bg-hover'
      }`}>
        <td className="w-10 px-3 py-2">
          <Checkbox
            checked={checked}
            onChange={() => onToggle(keyword.id)}
            aria-label={`Выбрать ${keyword.word}`}
          />
        </td>
        <td className="w-8 px-1 py-2">
          <button
            type="button"
            onClick={toggleExpand}
            className="flex min-h-7 min-w-7 items-center justify-center rounded text-text-muted hover:bg-bg-hover transition-colors duration-150 sm:min-h-6 sm:min-w-6"
            aria-label={expanded ? 'Скрыть формы' : 'Показать формы'}
            aria-expanded={expanded}
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        </td>
        <td className="max-w-xs truncate px-3 py-2">
          <span className="text-sm font-medium text-text-primary" title={keyword.word}>{keyword.word}</span>
        </td>
        <td className="px-3 py-2 text-sm text-text-secondary">
          {keyword.category || '\u2014'}
        </td>
        <td className="px-3 py-2">
          {keyword.isPhrase ? (
            <span className="inline-flex items-center gap-1 rounded-sm bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
              <Hash size={11} />
              Фраза
            </span>
          ) : (
            <span className="text-xs text-text-muted">{'\u2014'}</span>
          )}
        </td>
        <td className="px-3 py-2 text-xs text-text-muted tabular-nums">
          {new Date(keyword.createdAt).toLocaleDateString('ru-RU')}
        </td>
        <td className="w-20 px-3 py-2">
          {isConfirmingDelete ? (
            <ConfirmAction
              onConfirm={() => onDelete(keyword.id)}
              onCancel={onCancelDelete}
              isLoading={actionState.deleting === keyword.id}
            />
          ) : isDeleting ? (
            <span className="inline-flex items-center gap-1 text-xs text-warning">
              <AlertTriangle size={12} />
              Удаление...
            </span>
          ) : (
            <Button
              variant="ghost"
              size="xs"
              semantic="danger"
              onClick={() => onConfirmDelete(keyword.id)}
              aria-label={`Удалить ${keyword.word}`}
              icon={<Trash2 size={13} />}
            />
          )}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-bg-panel">
          <td colSpan={7} className="p-0">
            <FormsExpand keywordId={keyword.id} />
          </td>
        </tr>
      )}
    </>
  )
})
