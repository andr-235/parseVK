import { useAuthorsStore } from '@/modules/authors'
import { useCommentsStore } from '@/modules/comments'
import { useTasksStore } from '@/modules/tasks'
import { useWatchlistStore } from '@/modules/watchlist'

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
