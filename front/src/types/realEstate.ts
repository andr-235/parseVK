export type RealEstateListingSource = 'AVITO' | 'YOULA'

export type RealEstatePeriodFilter = '24h' | '3d' | '7d' | '30d' | 'all'

export type RealEstateReportFormat = 'xlsx' | 'csv' | 'json'

export interface RealEstateListing {
  id: number | string
  externalId?: string | null
  source: RealEstateListingSource
  title: string
  price?: number | null
  currency?: string | null
  address?: string | null
  url: string
  previewImageUrl?: string | null
  rooms?: string | null
  area?: string | null
  floor?: string | null
  postedAt?: string | null
  checkedAt?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  description?: string | null
}

export interface RealEstateSummary {
  total: number
  newToday: number
  updatedToday: number
  lastSyncedAt?: string | null
}

export interface RealEstateFilters {
  period: RealEstatePeriodFilter
  sources: RealEstateListingSource[]
  onlyNew: boolean
}

export interface RealEstateListingsResponse {
  items: RealEstateListing[]
  summary?: RealEstateSummary | null
  generatedAt?: string | null
}

export interface RealEstateScheduleSettings {
  enabled: boolean
  runHour: number
  runMinute: number
  timezoneOffsetMinutes: number
  lastRunAt: string | null
  nextRunAt: string | null
  isRunning: boolean
}

export interface RealEstateScheduleUpdatePayload {
  enabled: boolean
  runHour: number
  runMinute: number
  timezoneOffsetMinutes: number
}

export interface RealEstateSyncResult {
  source: RealEstateListingSource
  scrapedCount: number
  created: Array<Record<string, unknown>>
  updated: Array<Record<string, unknown>>
}

export interface RealEstateDailyCollectResult {
  avito: RealEstateSyncResult
  youla: RealEstateSyncResult
}

export interface RealEstateManualRunResponse {
  started: boolean
  reason: string | null
  settings: RealEstateScheduleSettings
  summary?: RealEstateDailyCollectResult | null
}
