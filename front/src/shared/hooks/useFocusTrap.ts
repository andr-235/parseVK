import { useEffect, useRef } from 'react'

const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function useFocusTrap(active: boolean) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!active || !ref.current) return

    const el = ref.current
    const prev = document.activeElement as HTMLElement | null

    const focusable = el.querySelectorAll<HTMLElement>(FOCUSABLE)
    const first = focusable[0]

    first?.focus()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return
      const focusableEls = el.querySelectorAll<HTMLElement>(FOCUSABLE)
      const f = focusableEls[0]
      const l = focusableEls[focusableEls.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === f) {
          e.preventDefault()
          l?.focus()
        }
      } else {
        if (document.activeElement === l) {
          e.preventDefault()
          f?.focus()
        }
      }
    }

    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      prev?.focus()
    }
  }, [active])

  return ref
}
