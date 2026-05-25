export interface FormatDateTimeOptions {
  emptyValue?: string
  invalidValue?: string
  includeTime?: boolean
  locale?: string
  dateTimeFormatOptions?: Intl.DateTimeFormatOptions
}

export const formatDateTime = (
  value: string | Date | null | undefined,
  options: FormatDateTimeOptions = {}
): string => {
  const {
    emptyValue = '—',
    invalidValue,
    includeTime = true,
    locale = 'ru-RU',
    dateTimeFormatOptions,
  } = options

  if (!value) {
    return emptyValue
  }

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    return invalidValue ?? (typeof value === 'string' ? value : emptyValue)
  }

  if (dateTimeFormatOptions) {
    return date.toLocaleString(locale, dateTimeFormatOptions)
  }

  const defaultOptions: Intl.DateTimeFormatOptions = includeTime
    ? {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }
    : {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }

  return date.toLocaleString(locale, defaultOptions)
}

export const formatDate = (
  value: string | Date | null | undefined,
  options: Omit<FormatDateTimeOptions, 'includeTime'> = {}
): string => {
  return formatDateTime(value, { ...options, includeTime: false })
}
