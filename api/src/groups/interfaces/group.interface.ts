export interface IGroupResponse {
  id: number;
  vkId: number;
  name: string;
  screenName?: string | null;
  isClosed?: number | null;
  deactivated?: string | null;
  type?: string | null;
  photo50?: string | null;
  photo100?: string | null;
  photo200?: string | null;
  activity?: string | null;
  ageLimits?: number | null;
  description?: string | null;
  membersCount?: number | null;
  status?: string | null;
  verified?: number | null;
  wall?: number | null;
  addresses?: any;
  city?: any;
  counters?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDeleteResponse {
  count: number;
}

export interface IGroupsListResponse {
  items: IGroupResponse[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
