import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'

import { useTasksQuery } from '@/queries/useTasksQuery'
import { useGroupsQuery } from '@/queries/useGroupsQuery'
import { useKeywordsQuery } from '@/queries/useKeywordsQuery'
import { useTaskAutomationQuery } from '@/queries/useTaskAutomationQuery'
import { useCommentsQuery } from '@/queries/useCommentsQuery'
import { useAuthorsQuery } from '@/queries/useAuthorsQuery'
import { useWatchlistAuthorsQuery, useWatchlistSettingsQuery } from '@/queries/useWatchlistQueries'
import { useTasksSocket } from '@/hooks/useTasksSocket'

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
