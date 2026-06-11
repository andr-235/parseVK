export type MonitorMessage = {
  id: string
  text: string | null
  createdAt: string | null
  author: string | null
  chat: string | null
  source: string | null
  contentUrl: string | null
  contentType: string | null
}

export type MonitorMessagesResponse = {
  items: MonitorMessage[]
  total: number
  usedKeywords: string[]
  lastSyncAt: string
  page: number
  limit: number
  hasMore: boolean
}

export type Messenger = 'whatsapp' | 'max'

export type MonitoringGroup = {
  id: number
  messenger: Messenger
  chatId: string
  name: string
  category: string | null
  createdAt: string | null
  updatedAt: string | null
}

export type MonitoringGroupsResponse = {
  items: MonitoringGroup[]
  total: number
}

export type MonitoringGroupCreatePayload = {
  messenger: Messenger
  chatId: string
  name: string
  category?: string | null
}

export type MonitoringGroupUpdatePayload = {
  messenger?: Messenger
  chatId?: string
  name?: string
  category?: string | null
}
