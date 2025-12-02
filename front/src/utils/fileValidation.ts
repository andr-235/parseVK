/**
 * Утилиты для валидации файлов
 */

export interface FileValidationError {
  fileName: string
  reason: 'type' | 'size'
}

/**
 * Проверяет, соответствует ли файл указанным accept-правилам
 * Поддерживает расширения (.txt), MIME типы (text/plain) и маски (image/*)
 */
export function matchesAccept(file: File, accept?: string): boolean {
  if (!accept) return true

  const tokens = accept
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)

  if (tokens.length === 0) return true

  const name = file.name.toLowerCase()
  const type = file.type.toLowerCase()

  return tokens.some((token) => {
    // Расширение файла: .txt
    if (token.startsWith('.')) return name.endsWith(token)

    // Маска MIME типа: image/*
    if (token.endsWith('/*')) {
      const base = token.slice(0, -1) // сохраняем '/'
      return type.startsWith(base)
    }

    // Точный MIME тип: text/plain
    if (token.includes('/')) return type === token

    // Fallback: расширение без точки
    return name.endsWith(`.${token}`)
  })
}

/**
 * Валидирует массив файлов по типу и размеру
 * @returns Объект с валидными файлами и массивом ошибок
 */
export function validateFiles(
  files: File[],
  accept?: string,
  maxSizeBytes?: number
): { valid: File[]; errors: FileValidationError[] } {
  const valid: File[] = []
  const errors: FileValidationError[] = []

  for (const file of files) {
    const typeOk = !accept || matchesAccept(file, accept)
    const sizeOk = !maxSizeBytes || file.size <= maxSizeBytes

    if (typeOk && sizeOk) {
      valid.push(file)
      continue
    }

    if (!typeOk) {
      errors.push({ fileName: file.name, reason: 'type' })
    }
    if (!sizeOk) {
      errors.push({ fileName: file.name, reason: 'size' })
    }
  }

  return { valid, errors }
}
