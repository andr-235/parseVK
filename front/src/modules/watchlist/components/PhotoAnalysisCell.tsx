import { Badge } from '@/components/ui/badge'
import type { WatchlistAuthorCard, PhotoAnalysisSummaryCategory } from '@/types'
import { formatDateTime } from '@/modules/watchlist/utils/watchlistUtils'
import { PHOTO_ANALYSIS_LABELS } from '@/modules/authorAnalysis/constants/photoAnalysisConstants'
import { WATCHLIST_CONSTANTS } from '@/modules/watchlist/constants/watchlist'

const getBadgeVariant = (count: number) => {
  if (count > 5) return 'destructive'
  if (count > 0) return 'secondary' // warning-like
  return 'outline'
}

const getBadgeClassName = (count: number) => {
  if (count > 5) {
    return 'border-destructive/40 bg-destructive/10 text-destructive text-xs font-medium'
  }
  if (count > 0) {
    return 'border-yellow-500/40 bg-yellow-500/10 text-yellow-700 text-xs font-medium'
  }
  return 'border-border/60 text-xs text-text-secondary'
}

interface PhotoAnalysisCellProps {
  item: WatchlistAuthorCard
}

export const PhotoAnalysisCell = ({ item }: PhotoAnalysisCellProps) => {
  const summary = item.analysisSummary
  if (!summary || !summary.categories) {
    return <span className="text-text-secondary">{WATCHLIST_CONSTANTS.NO_DATA}</span>
  }
  const lastAnalyzed = summary.lastAnalyzedAt
    ? formatDateTime(summary.lastAnalyzedAt)
    : WATCHLIST_CONSTANTS.NO_DATA

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1">
        {summary.categories.map((category: PhotoAnalysisSummaryCategory) => (
          <Badge
            key={category.name}
            variant={getBadgeVariant(category.count)}
            className={getBadgeClassName(category.count)}
          >
            {category.name}: {category.count}
          </Badge>
        ))}
      </div>
      <span className="text-xs text-text-secondary">
        {PHOTO_ANALYSIS_LABELS.SUSPICIOUS_LABEL}: {summary.suspicious} ·{' '}
        {PHOTO_ANALYSIS_LABELS.LAST_ANALYSIS_LABEL}: {lastAnalyzed}
      </span>
    </div>
  )
}
