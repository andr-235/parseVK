export type ClassValue =
  | string
  | number
  | null
  | false
  | undefined
  | ClassValue[]
  | Record<string, boolean | null | undefined>

const normalizeValue = (value: ClassValue): string[] => {
  if (value == null || value === false) {
    return []
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return String(value).split(/\s+/).filter(Boolean)
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => normalizeValue(item))
  }

  return Object.entries(value)
    .filter(([, condition]) => Boolean(condition))
    .flatMap(([key]) => normalizeValue(key))
}

export function cn(...inputs: ClassValue[]): string {
  return Array.from(new Set(inputs.flatMap((input) => normalizeValue(input)))).join(' ')
}
