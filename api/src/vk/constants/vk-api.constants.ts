/** Максимальное количество комментариев за один запрос к VK API */
export const VK_COMMENTS_MAX_COUNT = 100;

/** Количество вложенных комментариев (thread items) за один запрос */
export const VK_COMMENTS_THREAD_ITEMS_COUNT = 10;

/** Максимальное количество страниц при постраничном получении комментариев */
export const VK_COMMENTS_MAX_PAGES = 5;

/** Код ошибки VK API — стена отключена (wall is disabled) */
export const VK_ERROR_WALL_DISABLED = 15;

/** Максимальное количество постов за один запрос к VK API */
export const VK_POSTS_MAX_COUNT = 100;

/** Количество постов по умолчанию при запросе */
export const VK_POSTS_DEFAULT_COUNT = 10;

/** Максимальный размер батча для users.get */
export const VK_USERS_MAX_BATCH_SIZE = 1000;
