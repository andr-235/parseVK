import { useState, useCallback } from 'react'

export function useSelection<T = number>() {
  const [selected, setSelected] = useState<Set<T>>(new Set())

  const toggle = useCallback((id: T) => {
    setSelected((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id); else n.add(id)
      return n
    })
  }, [])

  const toggleAll = useCallback((ids: T[]) => {
    setSelected((prev) => (prev.size === ids.length ? new Set() : new Set(ids)))
  }, [])

  const clear = useCallback(() => setSelected(new Set()), [])

  const deselect = useCallback((ids: T[]) => {
    setSelected((prev) => {
      const n = new Set(prev)
      ids.forEach((id) => n.delete(id))
      return n
    })
  }, [])

  return { selected, toggle, toggleAll, clear, deselect, count: selected.size }
}
