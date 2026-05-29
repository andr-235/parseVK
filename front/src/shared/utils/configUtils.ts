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
