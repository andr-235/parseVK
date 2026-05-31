import type { TaskIdentifier } from './tasksStore.types'

export type UnknownRecord = Record<string, unknown>

export const toNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (!Number.isNaN(parsed)) {
      return parsed
    }
  }

  return undefined
}

export const firstDefined = <T>(...values: Array<T | undefined | null>): T | undefined => {
  return values.find((value) => value !== undefined && value !== null)
}

export const parseJsonObject = (input: unknown): UnknownRecord | null => {
  if (!input) {
    return null
  }

  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input)
      return typeof parsed === 'object' && parsed !== null ? (parsed as UnknownRecord) : null
    } catch {
      return null
    }
  }

  if (typeof input === 'object') {
    return input as UnknownRecord
  }

  return null
}

export const collectGroupIds = (...sources: unknown[]): TaskIdentifier[] => {
  const result: TaskIdentifier[] = []
  const seen = new Set<string>()

  const register = (value: unknown): void => {
    if (typeof value === 'number' || typeof value === 'string') {
      const key = String(value)
      if (!seen.has(key)) {
        seen.add(key)
        result.push(value)
      }
    }
  }

  for (const source of sources) {
    if (!source) {
      continue
    }

    if (Array.isArray(source)) {
      source.forEach((item) => {
        if (typeof item === 'number' || typeof item === 'string') {
          register(item)
        } else if (item && typeof item === 'object') {
          const data = item as UnknownRecord
          const candidate = firstDefined<number | string>(
            data.groupId as number | string,
            data.group_id as number | string,
            data.id as number | string,
            data.vkGroupId as number | string,
            data.vkId as number | string
          )
          if (candidate != null) {
            register(candidate)
          }
        }
      })
    }
  }

  return result
}

export const getNumericFromRecord = (
  source: UnknownRecord | null | undefined,
  ...keys: string[]
): number | undefined => {
  if (!source) {
    return undefined
  }

  for (const key of keys) {
    if (!(key in source)) {
      continue
    }

    const numeric = toNumber(source[key])
    if (numeric != null) {
      return numeric
    }
  }

  return undefined
}

export const hasObjectEntries = (data: UnknownRecord | null): boolean => {
  return !!data && Object.keys(data).length > 0
}

export const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
