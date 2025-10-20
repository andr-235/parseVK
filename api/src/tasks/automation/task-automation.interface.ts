export interface TaskAutomationSettings {
  id: number
  enabled: boolean
  runHour: number
  runMinute: number
  postLimit: number
  timezoneOffsetMinutes: number
  lastRunAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface TaskAutomationSettingsResponse {
  enabled: boolean
  runHour: number
  runMinute: number
  postLimit: number
  timezoneOffsetMinutes: number
  lastRunAt: string | null
  nextRunAt: string | null
  isRunning: boolean
}

export interface TaskAutomationRunResponse {
  started: boolean
  reason: string | null
  settings: TaskAutomationSettingsResponse
}
