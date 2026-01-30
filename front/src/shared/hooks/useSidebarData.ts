import { useAuthorsStore } from '@/modules/authors/store'
import { useCommentsStore } from '@/modules/comments/store'
import { useTasksStore } from '@/modules/tasks/store'
import { useWatchlistStore } from '@/modules/watchlist/store'

export function useSidebarData() {
  const tasksCount = useTasksStore((state) => state.tasks.length)
  const commentsCount = useCommentsStore((state) => state.totalCount)
  const watchlistCount = useWatchlistStore((state) => state.totalAuthors)
  const authorsTotal = useAuthorsStore((state) => state.total)

  return {
    tasksCount,
    commentsCount,
    watchlistCount,
    authorsTotal,
  }
}
