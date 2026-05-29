import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'

import { useTasksQuery } from '@/pages/tasks/hooks/useTasksQuery'
import { useGroupsQuery } from '@/pages/groups/hooks/useGroupsQuery'
import { useKeywordsQuery } from '@/pages/keywords/hooks/useKeywordsQuery'
import { useTaskAutomationQuery } from '@/pages/settings/hooks/useTaskAutomationQuery'
import { useCommentsQuery } from '@/pages/comments/hooks/useCommentsQuery'
import { useCommentsStore } from '@/pages/comments/store'
import { useAuthorsQuery } from '@/pages/authors/hooks/useAuthorsQuery'
import {
  useWatchlistAuthorsQuery,
  useWatchlistSettingsQuery,
} from '@/pages/watchlist/hooks/useWatchlistQueries'
import { useTasksSocket } from '@/pages/tasks/hooks/useTasksSocket'
import { useAuthStore } from '@/store/auth'
import { useKeywordsStore } from '@/pages/keywords/store'

const shouldSyncKeywords = (pathname: string): boolean => {
  return pathname.startsWith('/keywords') || pathname.startsWith('/comments')
}

const shouldSyncGroups = (pathname: string): boolean => {
  return pathname.startsWith('/groups') || pathname.startsWith('/tasks')
}

function AppSyncProvider(): null {
  const location = useLocation()
  const pathname = location.pathname
  const isAuthenticated = useAuthStore((state) => Boolean(state.accessToken && state.user))
  const keywordsReady = useKeywordsStore((state) => state.isReady)
  const commentsQueryEnabled = useCommentsStore((state) => state.isQueryEnabled)

  const syncGroups = useMemo(() => shouldSyncGroups(pathname), [pathname])
  const syncKeywords = useMemo(() => shouldSyncKeywords(pathname), [pathname])
  const syncComments = useMemo(() => pathname.startsWith('/comments'), [pathname])
  const syncAuthors = useMemo(() => pathname.startsWith('/authors'), [pathname])
  const syncWatchlist = useMemo(() => pathname.startsWith('/watchlist'), [pathname])

  useTasksQuery({ enabled: isAuthenticated })
  useTaskAutomationQuery({ enabled: isAuthenticated })
  useGroupsQuery({ enabled: isAuthenticated && syncGroups })
  useKeywordsQuery({ enabled: isAuthenticated && syncKeywords })
  useCommentsQuery({
    enabled: isAuthenticated && syncComments && keywordsReady && commentsQueryEnabled,
  })
  useAuthorsQuery(isAuthenticated && syncAuthors)
  useWatchlistAuthorsQuery(isAuthenticated && syncWatchlist)
  useWatchlistSettingsQuery(isAuthenticated && syncWatchlist)

  useTasksSocket({ enabled: isAuthenticated })

  return null
}

export default AppSyncProvider
