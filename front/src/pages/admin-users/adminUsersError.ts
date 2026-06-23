export function adminUsersError(error: unknown): string {
  if (!(error instanceof Error)) return 'Произошла неизвестная ошибка'
  try {
    const payload = JSON.parse(error.message) as { detail?: string }
    return payload.detail || error.message
  } catch {
    return error.message || 'Произошла неизвестная ошибка'
  }
}
