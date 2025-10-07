import { useState, useMemo, memo, useCallback } from 'react'
import type { TableColumn } from '../types'

interface TableProps {
  columns: TableColumn[]
  data: any[]
  emptyMessage?: string
  searchTerm?: string
}

type SortDirection = 'asc' | 'desc' | null

const DEFAULT_TRUNCATE_LENGTH = 180

const truncateText = (text: string, limit: number) => {
  if (text.length <= limit) {
    return text
  }

  const truncated = text.slice(0, limit)
  const lastSpace = truncated.lastIndexOf(' ')

  if (lastSpace === -1) {
    return `${truncated.trim()}…`
  }

  return `${truncated.slice(0, lastSpace).trim()}…`
}

const Table = memo(function Table({ columns, data, emptyMessage, searchTerm = '' }: TableProps) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [expandedCells, setExpandedCells] = useState<Set<string>>(() => new Set())

  const filteredData = useMemo(() => {
    if (!searchTerm) return data

    return data.filter((item) =>
      Object.values(item).some((value) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
  }, [data, searchTerm])

  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) return filteredData

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortKey]
      const bValue = b[sortKey]

      if (aValue === bValue) return 0

      const comparison = aValue > bValue ? 1 : -1
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [filteredData, sortKey, sortDirection])

  const handleSort = useCallback(
    (key: string) => {
      if (sortKey === key) {
        setSortDirection(
          sortDirection === 'asc' ? 'desc' : sortDirection === 'desc' ? null : 'asc'
        )
        if (sortDirection === 'desc') {
          setSortKey(null)
        }
      } else {
        setSortKey(key)
        setSortDirection('asc')
      }
    },
    [sortKey, sortDirection]
  )

  const toggleCell = useCallback((cellKey: string) => {
    setExpandedCells((prev) => {
      const next = new Set(prev)

      if (next.has(cellKey)) {
        next.delete(cellKey)
      } else {
        next.add(cellKey)
      }

      return next
    })
  }, [])

  const renderCell = useCallback(
    (item: any, col: TableColumn, rowIndex: number) => {
      const fallback = col.emptyValue ?? '-'
      const rawContent = col.render ? col.render(item, rowIndex) : item[col.key]

      if (
        rawContent === null ||
        rawContent === undefined ||
        (typeof rawContent === 'string' && rawContent.trim() === '')
      ) {
        return fallback
      }

      if (col.expandable && typeof rawContent === 'string') {
        const text = rawContent.trim()

        if (!text) {
          return fallback
        }

        const cellKey = `${item?.id ?? rowIndex}-${col.key}`
        const truncateAt = col.truncateAt ?? DEFAULT_TRUNCATE_LENGTH
        const shouldTruncate = text.length > truncateAt
        const isExpanded = expandedCells.has(cellKey)
        const displayText = !shouldTruncate || isExpanded ? text : truncateText(text, truncateAt)

        return (
          <div className="table-cell-expandable">
            <span>{displayText}</span>
            {shouldTruncate && (
              <button
                type="button"
                className="table-cell-toggle"
                onClick={() => toggleCell(cellKey)}
              >
                {isExpanded ? 'Скрыть' : 'Показать полностью'}
              </button>
            )}
          </div>
        )
      }

      return rawContent
    },
    [expandedCells, toggleCell]
  )

  if (sortedData.length === 0 && emptyMessage) {
    return (
      <p className="empty-message">
        {searchTerm ? 'Ничего не найдено' : emptyMessage}
      </p>
    )
  }

  return (
    <table className="keywords-table">
      <thead>
        <tr>
          {columns.map((col) => (
            <th
              key={col.key}
              onClick={() => col.sortable !== false && handleSort(col.key)}
              className={
                [col.sortable !== false ? 'sortable' : '', col.headerClassName]
                  .filter(Boolean)
                  .join(' ') || undefined
              }
            >
              {col.header}
              {sortKey === col.key && (
                <span className="sort-indicator">
                  {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                </span>
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sortedData.map((item, index) => {
          const rowKeyCandidate =
            item?.id ?? item?.key ?? item?.groupId ?? (Array.isArray(item?.groupIds) ? item.groupIds.join('-') : undefined)
          const rowKey =
            typeof rowKeyCandidate === 'number' || typeof rowKeyCandidate === 'string'
              ? rowKeyCandidate
              : index

          return (
            <tr key={String(rowKey)} className={item.isRead ? 'comment-read' : ''}>
              {columns.map((col) => (
                <td key={col.key} className={col.cellClassName || undefined}>
                  {renderCell(item, col, index)}
                </td>
              ))}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
})

export default Table
