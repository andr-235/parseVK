export interface IGroup {
  id: number;
  name: string;
  screen_name?: string;
  is_closed?: number;
  deactivated?: string;
  type?: string;
  photo_50?: string;
  photo_100?: string;
  photo_200?: string;
  activity?: string;
  age_limits?: number;
  description?: string;
  members_count?: number;
  status?: string;
  verified?: number;
  wall?: number;
  addresses?: unknown;
  city?: unknown;
  counters?: unknown;
}

export interface IGroupsResponse {
  groups: IGroup[];
  profiles: unknown[];
}
