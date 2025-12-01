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

