import { useCallback, useEffect, useMemo, useState } from 'react'

import type {
  TableColumn,
  TableSortDirection,
  TableSortState,
  TableSortValue,
} from '@/types'

type SortableColumnMap<T> = Map<string, TableColumn<T>>

interface UseTableSortingOptions {
  initialKey?: string
  initialDirection?: TableSortDirection
}

type ComparableValue = number | string | null

const collator = new Intl.Collator('ru', {
  numeric: true,
  sensitivity: 'base',
  ignorePunctuation: true,
})

const normalizeSortValue = (value: TableSortValue): ComparableValue => {
  if (value == null) {
    return null
  }

  if (value instanceof Date) {
    const time = value.getTime()
    return Number.isNaN(time) ? null : time
  }

  if (typeof value === 'number') {
    return Number.isNaN(value) ? null : value
  }

  if (typeof value === 'boolean') {
    return value ? 1 : 0
  }

  const stringValue = String(value).trim()
  if (!stringValue) {
    return null
  }

  return stringValue.toLowerCase()
}

const compareValues = (a: ComparableValue, b: ComparableValue): number => {
  if (a === null && b === null) {
    return 0
  }

  if (a === null) {
    return 1
  }

  if (b === null) {
    return -1
  }

  if (typeof a === 'number' && typeof b === 'number') {
    if (a === b) {
      return 0
    }
    return a < b ? -1 : 1
  }

  return collator.compare(String(a), String(b))
}

const buildColumnMap = <T,>(columns: TableColumn<T>[]): SortableColumnMap<T> => {
  const map: SortableColumnMap<T> = new Map()
  columns.forEach((column) => {
    map.set(column.key, column)
  })
  return map
}

const deriveSortValue = <T,>(
  item: T,
  column: TableColumn<T>,
): ComparableValue => {
  const raw = column.sortValue ? column.sortValue(item) : (item as any)[column.key]
  return normalizeSortValue(raw)
}

export function useTableSorting<T>(
  data: T[],
  columns: TableColumn<T>[],
  options?: UseTableSortingOptions,
) {
  const [sortState, setSortState] = useState<TableSortState | null>(() => {
    if (options?.initialKey) {
      return {
        key: options.initialKey,
        direction: options.initialDirection ?? 'asc',
      }
    }
    return null
  })

  const columnMap = useMemo(() => buildColumnMap(columns), [columns])

  useEffect(() => {
    if (!sortState) {
      return
    }
    if (!columnMap.has(sortState.key)) {
      setSortState(null)
    }
  }, [columnMap, sortState])

  const sortedItems = useMemo(() => {
    if (!sortState) {
      return data
    }

    const column = columnMap.get(sortState.key)
    if (!column || column.sortable === false) {
      return data
    }

    const itemsWithIndex = data.map((item, index) => ({
      item,
      index,
      value: deriveSortValue(item, column),
    }))

    itemsWithIndex.sort((a, b) => {
      const result = compareValues(a.value, b.value)
      if (result === 0) {
        return a.index - b.index
      }
      return sortState.direction === 'asc' ? result : -result
    })

    return itemsWithIndex.map((entry) => entry.item)
  }, [columnMap, data, sortState])

  const requestSort = useCallback(
    (key: string) => {
      const column = columnMap.get(key)
      if (!column || column.sortable === false) {
        return
      }

      setSortState((current) => {
        if (!current || current.key !== key) {
          return { key, direction: 'asc' }
        }

        return {
          key,
          direction: current.direction === 'asc' ? 'desc' : 'asc',
        }
      })
    },
    [columnMap],
  )

  const resetSort = useCallback(() => {
    setSortState(null)
  }, [])

  return {
    sortedItems,
    sortState,
    requestSort,
    resetSort,
  }
}
