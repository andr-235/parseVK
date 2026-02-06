import { firstDefined, toNumber } from '../../tasksStore.utils'
import type { UnknownRecord } from '../../tasksStore.utils'

export interface ExtractedTaskData {
  title: string | null
  scope: string | null
  skippedGroupsMessage: string | null
  postLimit: number | null
  createdAt: string
  completedAt: string | null
}

export const extractTaskData = (
  source: UnknownRecord,
  description: UnknownRecord | null,
  status?: string | null
): ExtractedTaskData => {
  const rawTitle = firstDefined<string | null>(
    source.title as string,
    source.name as string,
    description?.title as string
  )

  const scopeValue = firstDefined<string | null>(
    source.scope as string,
    description?.scope as string
  )

  const skippedGroupsMessage = firstDefined<string | null>(
    source.skippedGroupsMessage as string,
    description?.skippedGroupsMessage as string
  )

  const postLimitValue = firstDefined(toNumber(source.postLimit), toNumber(description?.postLimit))

  const createdAt =
    firstDefined<string>(source.createdAt as string, source.created_at as string) ??
    new Date().toISOString()

  const completedAt =
    firstDefined<string | null>(
      source.completedAt as string,
      source.completed_at as string,
      status === 'completed' ? (source.updatedAt as string) : undefined
    ) ?? null

  return {
    title: typeof rawTitle === 'string' ? rawTitle : null,
    scope: scopeValue ?? null,
    skippedGroupsMessage: skippedGroupsMessage ?? null,
    postLimit: postLimitValue ?? null,
    createdAt,
    completedAt,
  }
}
