export interface AuthorLocationDto {
  id?: number;
  title?: string;
}

export interface AuthorLastSeenDto {
  time?: number | null;
  platform?: number | null;
}

export interface AuthorProfileDto {
  id: number;
  vkUserId: number;
  firstName: string;
  lastName: string;
  fullName: string;
  deactivated: string | null;
  isClosed: boolean | null;
  domain: string | null;
  screenName: string | null;
  avatar: string | null;
  profileUrl: string;
}

export interface AuthorStatsDto {
  followersCount: number | null;
  counters: Record<string, number | null> | null;
}

export interface AuthorDetailsDto {
  about: string | null;
  activities: string | null;
  interests: string | null;
  music: string | null;
  movies: string | null;
  books: string | null;
  tv: string | null;
  status: string | null;
  site: string | null;
  bdate: string | null;
  homeTown: string | null;
  nickname: string | null;
  maidenName: string | null;
  relation: number | null;
  sex: number | null;
  timezone: number | null;
  education: Record<string, unknown> | null;
  occupation: Record<string, unknown> | null;
  personal: Record<string, unknown> | null;
  career: Array<Record<string, unknown>> | null;
  military: Array<Record<string, unknown>> | null;
  relatives: Array<Record<string, unknown>> | null;
  schools: Array<Record<string, unknown>> | null;
  universities: Array<Record<string, unknown>> | null;
  contacts: Record<string, string> | null;
  connections: Record<string, string> | null;
  lastSeen: AuthorLastSeenDto | null;
  city: AuthorLocationDto | null;
  country: AuthorLocationDto | null;
}

export interface AuthorCardDto {
  id: number;
  createdAt: string;
  updatedAt: string;
  profile: AuthorProfileDto;
  stats: AuthorStatsDto;
  details: AuthorDetailsDto;
}

export interface AuthorsListDto {
  items: AuthorCardDto[];
  total: number;
  hasMore: boolean;
}
