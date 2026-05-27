import { useAuthorsStore } from '@/store/authors/authorsStore'
import { useCommentsStore } from '@/store/comments/commentsStore'
import { useTasksStore } from '@/store/tasks/tasksStore'
import { useWatchlistStore } from '@/store/watchlist/watchlistStore'

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
