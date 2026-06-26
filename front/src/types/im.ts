export type ImMessage = {
  id: number
  text: string | null
  createdAt: string | null
  author: string | null
  chat: string | null
  messenger: string
  contentUrl: string | null
  contentType: string | null
  matchedKeywords: string[]
}

export type ImSearchResponse = {
  items: ImMessage[]
  total: number
  page: number
  limit: number
}

export type ImGroup = {
  id: number
  messenger: string
  chatId: string
  name: string
  category: string | null
  createdAt: string
  updatedAt: string
}

export type ImGroupCreatePayload = {
  messenger: string
  chatId: string
  name: string
  category?: string | null
}

export type ImGroupUpdatePayload = {
  name?: string | null
  category?: string | null
}
