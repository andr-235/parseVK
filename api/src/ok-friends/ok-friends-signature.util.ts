import { createHash } from 'crypto';

export interface OkApiParams {
  application_key: string;
  format?: string;
  method: string;
  [key: string]: string | number | undefined;
}

/**
 * Подпись запроса к OK API
 *
 * Алгоритм согласно документации OK API:
 * 1. Вычислить session_secret_key = MD5(access_token + application_secret_key).toLowerCase()
 * 2. Взять все параметры запроса, кроме access_token
 * 3. Отсортировать параметры по ключу
 * 4. Склеить: key1=value1key2=value2...
 * 5. Вычислить sig = MD5(queryString + session_secret_key).toLowerCase()
 *
 * @param params - Параметры запроса (без access_token)
 * @param accessToken - Access token пользователя
 * @param appSecretKey - Секретный ключ приложения (application_secret_key)
 * @returns Подпись запроса (sig) в lowercase
 */
export function signOkRequest(
  params: OkApiParams,
  accessToken: string,
  appSecretKey: string,
): string {
  const stringParams: Record<string, string> = {};

  // Конвертируем все параметры в строки
  // Важно: пустая строка должна быть включена в подпись
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      // Для пустой строки явно сохраняем пустую строку
      stringParams[key] = String(value);
    }
  }

  // Удаляем access_token из параметров (если был передан)
  delete stringParams.access_token;
  delete stringParams.session_key;

  // Сортируем параметры по ключу
  const sortedKeys = Object.keys(stringParams).sort();
  const queryString = sortedKeys
    .map((key) => `${key}=${stringParams[key]}`)
    .join('');

  // Вычисляем session_secret_key = MD5(access_token + application_secret_key).toLowerCase()
  const sessionSecretKey = createHash('md5')
    .update(accessToken + appSecretKey)
    .digest('hex')
    .toLowerCase();

  // Вычисляем sig = MD5(queryString + session_secret_key).toLowerCase()
  const sig = createHash('md5')
    .update(queryString + sessionSecretKey)
    .digest('hex')
    .toLowerCase();

  return sig;
}

/**
 * Подпись запроса к OK API для users.getInfo
 *
 * ВАЖНО: для users.getInfo session_key ВКЛЮЧАЕТСЯ в подпись (в отличие от friends.get)
 *
 * Алгоритм согласно документации OK API:
 * 1. Вычислить session_secret_key = MD5(session_key + application_secret_key).toLowerCase()
 * 2. Взять все параметры запроса, включая session_key
 * 3. Отсортировать параметры по ключу
 * 4. Склеить: key1=value1key2=value2...
 * 5. Вычислить sig = MD5(queryString + session_secret_key).toLowerCase()
 *
 * @param params - Параметры запроса (включая session_key)
 * @param accessToken - Session key пользователя
 * @param appSecretKey - Секретный ключ приложения (application_secret_key)
 * @returns Подпись запроса (sig) в lowercase
 */
export function signOkRequestForUsersGetInfo(
  params: OkApiParams,
  accessToken: string,
  appSecretKey: string,
): string {
  const stringParams: Record<string, string> = {};

  // Конвертируем все параметры в строки
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      stringParams[key] = String(value);
    }
  }

  // НЕ удаляем session_key из параметров (для users.getInfo он включается в подпись)
  // Удаляем только access_token (если был передан)
  delete stringParams.access_token;

  // Сортируем параметры по ключу
  const sortedKeys = Object.keys(stringParams).sort();
  const queryString = sortedKeys
    .map((key) => `${key}=${stringParams[key]}`)
    .join('');

  // Вычисляем session_secret_key = MD5(session_key + application_secret_key).toLowerCase()
  const sessionSecretKey = createHash('md5')
    .update(accessToken + appSecretKey)
    .digest('hex')
    .toLowerCase();

  // Вычисляем sig = MD5(queryString + session_secret_key).toLowerCase()
  const sig = createHash('md5')
    .update(queryString + sessionSecretKey)
    .digest('hex')
    .toLowerCase();

  return sig;
}
