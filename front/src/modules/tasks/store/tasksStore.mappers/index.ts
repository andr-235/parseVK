// Main mapper functions
export { mapSummaryToTask } from './mappers/mapSummaryToTask'
export { mapResultToTaskDetails } from './mappers/mapResultToTaskDetails'
export { mapGroup } from './mappers/mapGroup'
export { mapGroupProgress } from './mappers/mapGroupProgress'

// Extractor functions
export { extractTaskData } from './extractors/extractTaskData'
export type { ExtractedTaskData } from './extractors/extractTaskData'

export { extractGroupIds } from './extractors/extractGroupIds'
export type { ExtractedGroupIds } from './extractors/extractGroupIds'

export { extractAndMergeStats, buildTaskStats } from './extractors/extractStats'
export type { TaskStats } from './extractors/extractStats'

export { extractCounts } from './extractors/extractCounts'
export type { ExtractedCounts } from './extractors/extractCounts'

// Deriver functions
export {
  calculateProcessedItems,
  calculateProcessedGroupsCount,
  calculateAssumedProcessedGroups,
  calculateDerivedCounts,
  deriveFallbackStatus,
  normalizeSuccessAndFailedCounts,
  deriveStatsFields,
  buildFinalStats,
} from './derivers/deriveTaskFields'
export type {
  ProcessedItemsResult,
  DerivedCountsResult,
  NormalizedCountsResult,
  StatsFieldsResult,
} from './derivers/deriveTaskFields'

export { deriveGroupCounters } from './derivers/deriveGroupCounters'
export type { GroupCounters } from './derivers/deriveGroupCounters'
