import { useCallback, useEffect, useState } from 'react'

interface UseCommentsKeyboardNavOptions {
  commentIds: number[]
  onMarkRead: (id: number) => void
  onAddToWatchlist: (id: number) => void
}

export function useCommentsKeyboardNav({
  commentIds,
  onMarkRead,
  onAddToWatchlist,
}: UseCommentsKeyboardNavOptions) {
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const focusedId = focusedIndex >= 0 && focusedIndex < commentIds.length ? commentIds[focusedIndex] : null

  const scrollToCard = useCallback((id: number) => {
    const el = document.querySelector(`[data-comment-id="${id}"]`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('ring-2', 'ring-accent-primary/50', 'ring-offset-2', 'ring-offset-background-primary')
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-accent-primary/50', 'ring-offset-2', 'ring-offset-background-primary')
      }, 1500)
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return
      }

      if (commentIds.length === 0) return

      switch (e.key) {
        case 'j': {
          e.preventDefault()
          const next = Math.min(focusedIndex + 1, commentIds.length - 1)
          setFocusedIndex(next)
          scrollToCard(commentIds[next])
          break
        }
        case 'k': {
          e.preventDefault()
          const prev = Math.max(focusedIndex - 1, 0)
          setFocusedIndex(prev)
          scrollToCard(commentIds[prev])
          break
        }
        case 'm': {
          if (focusedId !== null) {
            e.preventDefault()
            onMarkRead(focusedId)
          }
          break
        }
        case 'w': {
          if (focusedId !== null) {
            e.preventDefault()
            onAddToWatchlist(focusedId)
          }
          break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [commentIds, focusedIndex, focusedId, onMarkRead, onAddToWatchlist, scrollToCard])

  return { focusedId, focusedIndex }
}
