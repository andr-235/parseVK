import { Spinner } from '@/components/ui/spinner'
import { WATCHLIST_CONSTANTS } from '@/modules/watchlist/constants/watchlist'

export const LoadingState = () => (
  <div className="flex items-center justify-center py-8">
    <Spinner className="h-6 w-6" />
  </div>
)

export const EmptyState = () => (
  <div className="py-6 text-center text-sm text-text-secondary">
    {WATCHLIST_CONSTANTS.EMPTY_AUTHORS_MESSAGE}
  </div>
)