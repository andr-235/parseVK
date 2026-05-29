export function mergeListsById<T>(
  incoming: T[],
  existing: T[],
  key: keyof T = 'id' as keyof T
): T[] {
  const incomingIds = new Set(incoming.map((item) => item[key]))
  const extras = existing.filter((item) => !incomingIds.has(item[key]))
  return [...incoming, ...extras]
}
