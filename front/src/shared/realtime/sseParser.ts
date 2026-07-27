/**
 * SSE parser — reusable between RealtimeClient and legacy FriendsExport.
 */

export interface SseEvent {
  id: string | null
  event: string
  data: unknown
}

export function parseSseChunk(buffer: string): { events: SseEvent[]; rest: string } {
  const events: SseEvent[] = []
  const parts = buffer.split('\n\n')
  const rest = parts.pop() ?? ''

  for (const part of parts) {
    let id: string | null = null
    let event = 'message'
    let data = ''

    for (const line of part.split('\n')) {
      if (line.startsWith('id: ')) {
        id = line.slice(4).trim()
      } else if (line.startsWith('event: ')) {
        event = line.slice(7).trim()
      } else if (line.startsWith('data: ')) {
        data = line.slice(6)
      }
    }

    // Skip heartbeats (lines starting with ":")
    if (part.trim().startsWith(':')) continue

    if (data) {
      let parsedData: unknown = data
      try {
        parsedData = JSON.parse(data)
      } catch {
        // Keep as string if not valid JSON
      }
      events.push({ id, event, data: parsedData })
    }
  }

  return { events, rest }
}
