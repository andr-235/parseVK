import path from 'path';

export const EXPORT_BATCH_SIZE = 1000;
export const EXPORT_DIR = path.resolve(process.cwd(), '.temp', 'ok-friends');
/** Хост REST API. apiok.ru — портал разработчиков (документация, настройки); api.ok.ru — REST API. */
export const OK_API_BASE_URL = 'https://api.ok.ru/api';
export const MAX_FRIENDS_LIMIT = 5000;
export const MAX_FRIENDS_STARS = 10000;
