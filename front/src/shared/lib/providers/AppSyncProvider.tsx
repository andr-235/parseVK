import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'

import { useTasksQuery } from '@/features/tasks/model/useTasksQuery'
import { useGroupsQuery } from '@/features/groups/model/useGroupsQuery'
import { useKeywordsQuery } from '@/features/keywords/model/useKeywordsQuery'
import { useTaskAutomationQuery } from '@/features/settings/model/useTaskAutomationQuery'
import { useCommentsQuery } from '@/features/comments/model/useCommentsQuery'
import { useAuthorsQuery } from '@/features/authors/model/useAuthorsQuery'
import {
  useWatchlistAuthorsQuery,
  useWatchlistSettingsQuery,
} from '@/features/watchlist/model/useWatchlistQueries'
import { useTasksSocket } from '@/features/tasks/model/useTasksSocket'
import { useAuthStore } from '@/store'

const shouldSyncKeywords = (pathname: string): boolean => {
  return pathname.startsWith('/keywords') || pathname.startsWith('/comments')
}

const shouldSyncGroups = (pathname: string): boolean => {
  return pathname.startsWith('/groups') || pathname.startsWith('/tasks')
}

function AppSyncProvider(): null {
  const location = useLocation()
  const pathname = location.pathname
  const isAuthenticated = useAuthStore((state) =>
    Boolean(state.accessToken && state.user && !state.user.isTemporaryPassword)
  )

  const syncGroups = useMemo(() => shouldSyncGroups(pathname), [pathname])
  const syncKeywords = useMemo(() => shouldSyncKeywords(pathname), [pathname])
  const syncComments = useMemo(() => pathname.startsWith('/comments'), [pathname])
  const syncAuthors = useMemo(() => pathname.startsWith('/authors'), [pathname])
  const syncWatchlist = useMemo(() => pathname.startsWith('/watchlist'), [pathname])

  useTasksQuery({ enabled: isAuthenticated })
  useTaskAutomationQuery({ enabled: isAuthenticated })
  useGroupsQuery({ enabled: isAuthenticated && syncGroups })
  useKeywordsQuery({ enabled: isAuthenticated && syncKeywords })
  useCommentsQuery({ enabled: isAuthenticated && syncComments })
  useAuthorsQuery(isAuthenticated && syncAuthors)
  useWatchlistAuthorsQuery(isAuthenticated && syncWatchlist)
  useWatchlistSettingsQuery(isAuthenticated && syncWatchlist)

  useTasksSocket({ enabled: isAuthenticated })

  return null
}

export default AppSyncProvider
