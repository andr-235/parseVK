/**
 * Сохраняет бинарный отчёт на устройство пользователя.
 */
export const saveReportBlob = (blob: Blob, filename: string) => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return
  }

  const safeName = filename.trim() || 'report'
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = safeName
  anchor.rel = 'noopener noreferrer'
  anchor.style.display = 'none'

  document.body.appendChild(anchor)
  anchor.click()

  requestAnimationFrame(() => {
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  })
}
