import { useEffect, type RefObject } from 'react'

export interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  enabled?: boolean
}

export function useIntersectionObserver(
  targetRef: RefObject<HTMLElement | null>,
  onIntersect: () => void,
  { enabled = true, root = null, rootMargin = '0px', threshold = 0 }: UseIntersectionObserverOptions = {}
): void {
  useEffect(() => {
    if (!enabled) return

    const el = targetRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0]
        if (first?.isIntersecting) {
          onIntersect()
        }
      },
      { root, rootMargin, threshold }
    )

    observer.observe(el)

    return () => {
      observer.disconnect()
    }
  }, [targetRef, onIntersect, enabled, root, rootMargin, threshold])
}
