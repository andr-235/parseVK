export const formatSourceLabel = (value?: string | null): string => {
  if (!value) return 'Не указан'
  const map: Record<string, string> = {
    avito: 'Авито',
    youla: 'Юла',
    юла: 'Юла',
    avto: 'Авто',
  }
  const key = value.toLowerCase()
  return map[key] || value
}

export const formatPriceValue = (price?: number | null, currency?: string | null): string => {
  if (price == null) return '—'
  try {
    if (currency) {
      return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: currency.toUpperCase(),
        maximumFractionDigits: 0,
      }).format(price)
    }
  } catch {
    // fallback below
  }
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(price)
}

export const formatDateShort = (value?: string | null): string => {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'short' }).format(d)
}

export const buildParamsString = (listing: {
  rooms?: number | null
  areaTotal?: number | null
  floor?: number | null
  floorsTotal?: number | null
}): string => {
  const parts: string[] = []
  if (listing.rooms != null) parts.push(`${listing.rooms}к`)
  if (listing.areaTotal != null) {
    parts.push(
      `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(listing.areaTotal)} м²`
    )
  }
  if (listing.floor != null) {
    parts.push(
      listing.floorsTotal != null
        ? `${listing.floor}/${listing.floorsTotal} эт.`
        : `${listing.floor} эт.`
    )
  }
  return parts.join(' · ')
}
