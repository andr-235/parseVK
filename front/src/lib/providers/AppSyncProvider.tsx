import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'

import { useTasksQuery } from '@/modules/tasks/hooks/useTasksQuery'
import { useGroupsQuery } from '@/modules/groups/hooks/useGroupsQuery'
import { useKeywordsQuery } from '@/modules/keywords/hooks/useKeywordsQuery'
import { useTaskAutomationQuery } from '@/modules/settings/hooks/useTaskAutomationQuery'
import { useCommentsQuery } from '@/modules/comments/hooks/useCommentsQuery'
import { useAuthorsQuery } from '@/modules/authors/hooks/useAuthorsQuery'
import {
  useWatchlistAuthorsQuery,
  useWatchlistSettingsQuery,
} from '@/modules/watchlist/hooks/useWatchlistQueries'
import { useTasksSocket } from '@/modules/tasks/hooks/useTasksSocket'

const shouldSyncKeywords = (pathname: string): boolean => {
  return pathname.startsWith('/keywords') || pathname.startsWith('/comments')
}

const shouldSyncGroups = (pathname: string): boolean => {
  return pathname.startsWith('/groups') || pathname.startsWith('/tasks')
}

function AppSyncProvider(): null {
  const location = useLocation()
  const pathname = location.pathname

  const syncGroups = useMemo(() => shouldSyncGroups(pathname), [pathname])
  const syncKeywords = useMemo(() => shouldSyncKeywords(pathname), [pathname])
  const syncComments = useMemo(() => pathname.startsWith('/comments'), [pathname])
  const syncAuthors = useMemo(() => pathname.startsWith('/authors'), [pathname])
  const syncWatchlist = useMemo(() => pathname.startsWith('/watchlist'), [pathname])

  useTasksQuery()
  useTaskAutomationQuery()
  useGroupsQuery({ enabled: syncGroups })
  useKeywordsQuery({ enabled: syncKeywords })
  useCommentsQuery({ enabled: syncComments })
  useAuthorsQuery(syncAuthors)
  useWatchlistAuthorsQuery(syncWatchlist)
  useWatchlistSettingsQuery(syncWatchlist)

  useTasksSocket()

  return null
}

export default AppSyncProvider
