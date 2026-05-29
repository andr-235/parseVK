import { useEffect } from 'react'

type ShortcutMap = Record<string, () => void>

function isInputElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false
  const tag = target.tagName.toLowerCase()
  return (
    tag === 'input' ||
    tag === 'textarea' ||
    tag === 'select' ||
    target.isContentEditable
  )
}

function findSearchInput(): HTMLInputElement | HTMLTextAreaElement | null {
  const candidates = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
    'input[type="text"], input[type="search"], input:not([type]), textarea'
  )
  for (const el of candidates) {
    const placeholder = el.placeholder.toLowerCase()
    if (
      placeholder.includes('поиск') ||
      placeholder.includes('search')
    ) {
      return el
    }
  }
  for (const el of candidates) {
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      return el
    }
  }
  return null
}

function findActionButton(): HTMLButtonElement | null {
  const buttons = document.querySelectorAll<HTMLButtonElement>('button')
  for (const btn of buttons) {
    const label = btn.ariaLabel?.toLowerCase() ?? ''
    const text = btn.textContent?.toLowerCase() ?? ''
    if (
      label.includes('создать') ||
      label.includes('new') ||
      label.includes('add') ||
      text.includes('новая задача') ||
      text.includes('создать') ||
      text.includes('добавить')
    ) {
      return btn
    }
  }
  return null
}

function findRefreshButton(): HTMLButtonElement | null {
  const buttons = document.querySelectorAll<HTMLButtonElement>('button')
  for (const btn of buttons) {
    const text = btn.textContent?.toLowerCase() ?? ''
    if (text.includes('обновить') || text.includes('refresh')) {
      return btn
    }
  }
  return null
}

export const useGlobalShortcuts = (): void => {
  useEffect(() => {
    const shortcuts: ShortcutMap = {
      '/': () => {
        const input = findSearchInput()
        if (input) {
          input.focus()
          input.setSelectionRange(input.value.length, input.value.length)
        }
      },
      n: () => {
        findActionButton()?.click()
      },
      r: () => {
        findRefreshButton()?.click()
      },
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isInputElement(event.target)) return

      const key = event.key === 'Escape' ? 'Escape' : event.key.toLowerCase()
      const handler = shortcuts[key]
      if (handler) {
        event.preventDefault()
        handler()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
}
