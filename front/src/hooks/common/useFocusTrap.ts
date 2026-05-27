import { useEffect, useRef } from 'react'

interface UseFocusTrapOptions {
  isOpen: boolean
  onClose: () => void
}

export const useFocusTrap = <T extends HTMLElement>({ isOpen, onClose }: UseFocusTrapOptions) => {
  const containerRef = useRef<T>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isOpen) return

    // Save previous active element to restore focus when closed
    previousFocusRef.current = document.activeElement as HTMLElement

    // Lock body scrolling
    const originalOverflow = document.body.style.overflow
    const originalPaddingRight = document.body.style.paddingRight

    // Estimate scrollbar width to prevent layout shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`
    }

    const container = containerRef.current
    if (!container) return

    // Focusable elements selector
    const focusableSelector =
      'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"]), [contenteditable]'

    const getFocusableElements = (): HTMLElement[] => {
      if (!container) return []
      return Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)).filter((el) => {
        if (el.tabIndex === -1) return false

        // In jsdom, layout properties like offsetWidth/offsetHeight are always 0.
        // We use window.getComputedStyle to check visibility instead.
        const style = window.getComputedStyle(el)
        return style.display !== 'none' && style.visibility !== 'hidden'
      })
    }

    // Set initial focus to the first focusable element, or the container itself
    const focusableElements = getFocusableElements()
    if (focusableElements.length > 0) {
      // Small timeout to allow animation / rendering to complete
      const timeoutId = setTimeout(() => {
        focusableElements[0].focus()
      }, 50)

      return () => {
        clearTimeout(timeoutId)
        // Clean up body scroll settings
        document.body.style.overflow = originalOverflow
        document.body.style.paddingRight = originalPaddingRight

        // Restore previous focus
        if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
          previousFocusRef.current.focus()
        }
      }
    }

    return () => {
      // Clean up body scroll settings
      document.body.style.overflow = originalOverflow
      document.body.style.paddingRight = originalPaddingRight

      // Restore previous focus
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus()
      }
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }

      if (e.key === 'Tab') {
        const container = containerRef.current
        if (!container) return

        const focusableSelector =
          'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"]), [contenteditable]'

        const focusableElements = Array.from(
          container.querySelectorAll<HTMLElement>(focusableSelector)
        ).filter((el) => {
          if (el.tabIndex === -1) return false
          const style = window.getComputedStyle(el)
          return style.display !== 'none' && style.visibility !== 'hidden'
        })

        if (focusableElements.length === 0) {
          e.preventDefault()
          return
        }

        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]
        const activeElement = document.activeElement

        if (e.shiftKey) {
          // Shift + Tab: going backwards
          if (activeElement === firstElement || !container.contains(activeElement)) {
            e.preventDefault()
            lastElement.focus()
          }
        } else {
          // Tab: going forwards
          if (activeElement === lastElement || !container.contains(activeElement)) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    // Keep focus inside modal if user clicks outside or manages to focus something else
    const handleFocusIn = (e: FocusEvent) => {
      const container = containerRef.current
      if (!container) return

      if (!container.contains(e.target as Node)) {
        const focusableSelector =
          'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"]), [contenteditable]'

        const focusableElements = Array.from(
          container.querySelectorAll<HTMLElement>(focusableSelector)
        ).filter((el) => {
          if (el.tabIndex === -1) return false
          const style = window.getComputedStyle(el)
          return style.display !== 'none' && style.visibility !== 'hidden'
        })

        if (focusableElements.length > 0) {
          e.preventDefault()
          focusableElements[0].focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('focusin', handleFocusIn)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('focusin', handleFocusIn)
    }
  }, [isOpen, onClose])

  return containerRef
}
