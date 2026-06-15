import { apiGet, apiPost, apiDelete } from './client'

export type Group = {
  id: number
  vkGroupId: number
  screenName: string | null
  name: string | null
  isClosed: boolean | null
  deactivated: string | null
  type: string | null
  photo50: string | null
  activity: string | null
  description: string | null
  membersCount: number | null
  status: string | null
  verified: number | null
  wall: number | null
  city: { id: number; title: string } | null
  createdAt: string
  lastCollectedAt: string | null
  updatedAt: string
}

type BackendGroup = {
  id: number
  vkId: number
  vkGroupId: number
  screenName: string | null
  name: string | null
  isClosed: boolean | null
  deactivated: string | null
  type: string | null
  photo50: string | null
  activity: string | null
  description: string | null
  membersCount: number | null
  status: string | null
  verified: number | null
  wall: number | null
  city: { id: number; title: string } | null
  createdAt: string
  lastCollectedAt: string | null
  updatedAt: string
}

function mapGroup(b: BackendGroup): Group {
  return {
    id: b.id,
    vkGroupId: b.vkGroupId,
    screenName: b.screenName,
    name: b.name,
    isClosed: b.isClosed,
    deactivated: b.deactivated,
    type: b.type,
    photo50: b.photo50,
    activity: b.activity,
    description: b.description,
    membersCount: b.membersCount,
    status: b.status,
    verified: b.verified,
    wall: b.wall,
    city: b.city,
    createdAt: b.createdAt,
    lastCollectedAt: b.lastCollectedAt,
    updatedAt: b.updatedAt,
  }
}

export type GroupsResponse = {
  items: Group[]
  total: number
  hasMore: boolean
}

export type GroupsQueryParams = {
  limit?: number
  page?: number
  search?: string
  sortBy?: string
  sortOrder?: string
}

export async function fetchGroups(params?: GroupsQueryParams): Promise<GroupsResponse> {
  const data = await apiGet<{ items: BackendGroup[]; total: number; hasMore: boolean }>(
    '/content/groups',
    params as Record<string, string | number | undefined>,
  )
  return { items: data.items.map(mapGroup), total: data.total, hasMore: data.hasMore }
}

export type RegionGroup = {
  id: number
  vkId: number
  vkGroupId: number
  name: string | null
  screenName: string | null
  isClosed: number | null
  deactivated: string | null
  type: string | null
  photo50: string | null
  membersCount: number | null
  city: { id: number; title: string } | null
  verified: number | null
  description: string | null
  existsInDb: boolean
}

export type RegionSearchResponse = {
  total: number
  groups: RegionGroup[]
  existsInDb: RegionGroup[]
  missing: RegionGroup[]
}

export async function searchGroupsRegion(query?: string): Promise<RegionSearchResponse> {
  return apiGet<RegionSearchResponse>('/content/groups/search/region', query ? { query } : undefined)
}

export async function saveGroup(identifier: string): Promise<unknown> {
  return apiPost('/content/groups/save', { identifier })
}

export async function deleteGroup(vkGroupId: number): Promise<void> {
  await apiDelete<{ deleted: boolean }>(`/content/groups/${vkGroupId}`)
}
