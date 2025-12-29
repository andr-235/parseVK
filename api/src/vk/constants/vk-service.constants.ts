/**
 * Константы для VK сервисов
 */

export const VK_API_CONSTANTS = {
  /** Таймаут API по умолчанию (мс) */
  API_TIMEOUT_FALLBACK: 60_000,

  /** Максимальное количество пользователей в одном батче */
  USERS_BATCH_SIZE: 1000,

  /** Максимальное количество групп в одном батче для getById */
  GROUPS_BATCH_SIZE: 400,

  /** Размер страницы для поиска групп */
  GROUPS_SEARCH_PAGE_SIZE: 200,

  /** Размер страницы для городов */
  CITIES_PAGE_SIZE: 1000,

  /** Максимальное количество фото для получения */
  PHOTOS_MAX_COUNT: 200,

  /** Максимальное количество постов */
  POSTS_MAX_COUNT: 100,

  /** Максимальное количество комментариев в одном запросе */
  COMMENTS_MAX_COUNT: 100,

  /** Максимальное количество страниц для получения комментариев автора */
  AUTHOR_COMMENTS_MAX_PAGES: 5,

  /** Размер батча для получения комментариев автора */
  AUTHOR_COMMENTS_BATCH_SIZE: 100,

  /** Количество тредовых элементов по умолчанию */
  DEFAULT_THREAD_ITEMS_COUNT: 10,

  /** Регион для поиска групп по умолчанию */
  DEFAULT_SEARCH_REGION: 'Еврейская автономная область',

  /** ID группы для health check */
  HEALTH_CHECK_GROUP_ID: '1',
} as const;

export const VK_PHOTO_SIZES_PRIORITY = ['w', 'z', 'y', 'x', 'm', 's'] as const;

export const VK_USER_FIELDS: Array<
  | 'about'
  | 'activities'
  | 'bdate'
  | 'books'
  | 'career'
  | 'city'
  | 'connections'
  | 'contacts'
  | 'counters'
  | 'country'
  | 'domain'
  | 'education'
  | 'followers_count'
  | 'home_town'
  | 'interests'
  | 'last_seen'
  | 'maiden_name'
  | 'military'
  | 'movies'
  | 'music'
  | 'nickname'
  | 'occupation'
  | 'personal'
  | 'photo_50'
  | 'photo_100'
  | 'photo_200'
  | 'photo_200_orig'
  | 'photo_400_orig'
  | 'photo_id'
  | 'photo_max'
  | 'photo_max_orig'
  | 'relation'
  | 'relatives'
  | 'schools'
  | 'screen_name'
  | 'sex'
  | 'site'
  | 'status'
  | 'timezone'
  | 'tv'
  | 'universities'
> = [
  'about',
  'activities',
  'bdate',
  'books',
  'career',
  'city',
  'connections',
  'contacts',
  'counters',
  'country',
  'domain',
  'education',
  'followers_count',
  'home_town',
  'interests',
  'last_seen',
  'maiden_name',
  'military',
  'movies',
  'music',
  'nickname',
  'occupation',
  'personal',
  'photo_50',
  'photo_100',
  'photo_200',
  'photo_200_orig',
  'photo_400_orig',
  'photo_id',
  'photo_max',
  'photo_max_orig',
  'relation',
  'relatives',
  'schools',
  'screen_name',
  'sex',
  'site',
  'status',
  'timezone',
  'tv',
  'universities',
];

export const VK_GROUP_FIELDS: Array<
  | 'description'
  | 'members_count'
  | 'counters'
  | 'activity'
  | 'age_limits'
  | 'status'
  | 'verified'
  | 'wall'
  | 'addresses'
  | 'city'
  | 'contacts'
  | 'site'
> = [
  'description',
  'members_count',
  'counters',
  'activity',
  'age_limits',
  'status',
  'verified',
  'wall',
  'addresses',
  'city',
  'description',
  'members_count',
  'city',
  'activity',
  'status',
  'verified',
  'description',
  'addresses',
  'contacts',
  'site',
];

export const VK_GROUP_SEARCH_FIELDS = [
  'members_count',
  'city',
  'activity',
  'status',
  'verified',
  'description',
  'addresses',
  'contacts',
  'site',
] as const;
