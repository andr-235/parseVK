import type { IAuthor } from '../interfaces/author.interfaces';
import type { IPost } from '../interfaces/post.interfaces';

/**
 * Утилиты для нормализации данных VK API
 */

/**
 * Нормализует булево значение из VK API
 */
export function normalizeBoolean(
  value?: boolean | number | null,
): boolean | undefined {
  if (typeof value === 'number') {
    return value !== 0;
  }
  if (value === null || value === undefined) {
    return undefined;
  }
  return Boolean(value);
}

/**
 * Нормализует число из VK API, возвращает undefined если не число
 */
export function normalizeNumber(value?: number | null): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

/**
 * Нормализует строку из VK API, возвращает undefined если пустая строка
 */
export function normalizeString(value?: string | null): string | undefined {
  return value && value.trim() ? value.trim() : undefined;
}

/**
 * Нормализует массив, фильтруя null/undefined значения
 */
export function normalizeArray<T>(value?: T[] | null): T[] {
  return value?.filter((item) => item != null) ?? [];
}

/**
 * Нормализует автора из VK API
 */
export function normalizeAuthor(author: {
  id: number;
  first_name?: string;
  last_name?: string;
  deactivated?: string;
  is_closed?: boolean | number;
  can_access_closed?: boolean | number;
  domain?: string;
  screen_name?: string;
  photo_50?: string;
  photo_100?: string;
  photo_200?: string;
  photo_200_orig?: string;
  photo_400_orig?: string;
  photo_max?: string;
  photo_max_orig?: string;
  photo_id?: string;
  city?: any;
  country?: any;
  about?: string;
  activities?: string;
  bdate?: string;
  books?: string;
  career?: any;
  connections?: any;
  contacts?: any;
  counters?: any;
  education?: any;
  followers_count?: number;
  home_town?: string;
  interests?: string;
  last_seen?: any;
  maiden_name?: string;
  military?: any;
  movies?: string;
  music?: string;
  nickname?: string;
  occupation?: any;
  personal?: any;
  relatives?: any;
  relation?: number;
  schools?: any;
  sex?: number;
  site?: string;
  status?: string;
  timezone?: number;
  tv?: string;
  universities?: any;
}): IAuthor {
  return {
    id: author.id,
    first_name: author.first_name ?? '',
    last_name: author.last_name ?? '',
    deactivated: author.deactivated ?? undefined,
    is_closed: normalizeBoolean(author.is_closed),
    can_access_closed: normalizeBoolean(author.can_access_closed),
    domain: normalizeString(author.domain),
    screen_name: normalizeString(author.screen_name),
    photo_50: normalizeString(author.photo_50),
    photo_100: normalizeString(author.photo_100),
    photo_200: normalizeString(author.photo_200),
    photo_200_orig: normalizeString(author.photo_200_orig),
    photo_400_orig: normalizeString(author.photo_400_orig),
    photo_max: normalizeString(author.photo_max),
    photo_max_orig: normalizeString(author.photo_max_orig),
    photo_id: normalizeString(author.photo_id),
    city: author.city as IAuthor['city'] | undefined,
    country: author.country as IAuthor['country'] | undefined,
    about: normalizeString(author.about),
    activities: normalizeString(author.activities),
    bdate: normalizeString(author.bdate),
    books: normalizeString(author.books),
    career: author.career as unknown as IAuthor['career'] | undefined,
    connections: author.connections as unknown as
      | IAuthor['connections']
      | undefined,
    contacts: author.contacts as unknown as IAuthor['contacts'] | undefined,
    counters: author.counters as unknown as IAuthor['counters'] | undefined,
    education: author.education as unknown as IAuthor['education'] | undefined,
    followers_count: normalizeNumber(author.followers_count),
    home_town: normalizeString(author.home_town),
    interests: normalizeString(author.interests),
    last_seen: author.last_seen as IAuthor['last_seen'] | undefined,
    maiden_name: normalizeString(author.maiden_name),
    military: author.military as IAuthor['military'] | undefined,
    movies: normalizeString(author.movies),
    music: normalizeString(author.music),
    nickname: normalizeString(author.nickname),
    occupation: author.occupation as IAuthor['occupation'] | undefined,
    personal: author.personal as IAuthor['personal'] | undefined,
    relatives: author.relatives as IAuthor['relatives'] | undefined,
    relation: normalizeNumber(author.relation),
    schools: author.schools as IAuthor['schools'] | undefined,
    sex: normalizeNumber(author.sex),
    site: normalizeString(author.site),
    status: normalizeString(author.status),
    timezone: normalizeNumber(author.timezone),
    tv: normalizeString(author.tv),
    universities: author.universities as IAuthor['universities'] | undefined,
  };
}

/**
 * Нормализует пост из VK API
 */
export function normalizePost(post: {
  id: number;
  owner_id: number;
  from_id: number;
  date: number;
  text?: string;
  attachments?: any[];
  comments?: {
    count?: number;
    can_post?: number;
    groups_can_post?: boolean | number;
    can_close?: boolean | number;
    can_open?: boolean | number;
  };
}): IPost {
  return {
    id: post.id,
    owner_id: post.owner_id,
    from_id: post.from_id,
    date: post.date,
    text: post.text ?? '',
    attachments: post.attachments,
    comments: {
      count: normalizeNumber(post.comments?.count) ?? 0,
      can_post: normalizeNumber(post.comments?.can_post) ?? 0,
      groups_can_post:
        normalizeBoolean(post.comments?.groups_can_post) ?? false,
      can_close: normalizeBoolean(post.comments?.can_close) ?? false,
      can_open: normalizeBoolean(post.comments?.can_open) ?? false,
    },
  };
}
