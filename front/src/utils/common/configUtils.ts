const dateFormatter = new Intl.DateTimeFormat('ru-RU')

export const formatDate = (value?: string | null): string => {
  if (!value) {
    return '—'
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date)
}

export const formatDateTime = (value: string | null | undefined): string => {
  if (!value) {
    return '-'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString('ru-RU')
}

export const toNumber = (value: unknown): number | null =>
  typeof value === 'number' ? value : null

export const resolveNumber = (...values: unknown[]): number | null => {
  for (const value of values) {
    const numeric = toNumber(value)
    if (numeric != null) {
      return numeric
    }
  }
  return null
}

export const formatPair = (left: number | null, right: number | null): string =>
  `${left ?? '—'} / ${right ?? '—'}`

export const getAuthorInitials = (name: string): string => {
  const sanitized = name.replace(/^https?:\/\//, '')

  if (!sanitized.trim()) {
    return '—'
  }

  if (sanitized.startsWith('vk.com/id')) {
    return 'VK'
  }

  const parts = sanitized.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) {
    return sanitized.charAt(0).toUpperCase() || '—'
  }

  const initials = parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
  return initials || parts[0].charAt(0).toUpperCase() || '—'
}
