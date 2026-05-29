import { useAuthorsStore } from '@/pages/authors/store/authorsStore'
import { useCommentsStore } from '@/pages/comments/store/commentsStore'
import { useTasksStore } from '@/pages/tasks/store/tasksStore'
import { useWatchlistStore } from '@/pages/watchlist/store/watchlistStore'

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
