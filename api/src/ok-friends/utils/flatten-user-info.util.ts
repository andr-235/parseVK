import type { OkUserInfo } from '../ok-api.service';

/**
 * Расплющивает вложенные объекты в плоскую структуру для экспорта в XLSX
 *
 * Примеры:
 * - location.city → location_city
 * - location_of_birth.country → location_of_birth_country
 * - current_location.latitude → current_location_latitude
 * - Массивы сохраняются как JSON строки
 * - Сложные вложенные структуры рекурсивно расплющиваются
 */
export function flattenUserInfo(
  user: OkUserInfo,
): Record<string, string | number | boolean | null> {
  const flattened: Record<string, string | number | boolean | null> = {};

  for (const [key, value] of Object.entries(user)) {
    if (value === null || value === undefined) {
      flattened[key] = null;
      continue;
    }

    // Обработка примитивных типов
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      flattened[key] = value;
      continue;
    }

    // Обработка дат (Date объекты)
    if (value instanceof Date) {
      flattened[key] = value.toISOString();
      continue;
    }

    // Обработка массивов - сохраняем как JSON строку
    // Массивы могут содержать:
    // - Примитивы (possible_relations: ["ALL", "BROTHERSISTER", ...])
    // - Объекты (presents: [{...}], relations: [{...}], profile_buttons: [{...}], social_aliases: [{...}])
    if (Array.isArray(value)) {
      // Если массив пустой, сохраняем как пустую JSON строку
      if (value.length === 0) {
        flattened[key] = '[]';
      } else {
        // Проверяем, содержит ли массив только примитивы
        const isPrimitiveArray = value.every(
          (item) =>
            item === null ||
            typeof item === 'string' ||
            typeof item === 'number' ||
            typeof item === 'boolean',
        );

        if (isPrimitiveArray) {
          // Для массивов примитивов сохраняем как JSON строку
          flattened[key] = JSON.stringify(value);
        } else {
          // Для массивов объектов также сохраняем как JSON строку
          // (можно было бы расплющить каждый элемент, но это усложнит структуру колонок)
          flattened[key] = JSON.stringify(value, null, 0);
        }
      }
      continue;
    }

    // Обработка вложенных объектов - расплющиваем с префиксом
    // Поддерживаем структуры:
    // - location, location_of_birth (city, country, countryCode, countryName)
    // - nn_photo_set_ids (объект с динамическими ключами)
    // - profile_cover (с вложенными объектами)
    // - relationship (с вложенными объектами и массивами)
    // - rkn_mark (объект)
    // - skill (с вложенными объектами и массивами)
    // - status (объект)
    if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
      const nested = flattenObject(value as Record<string, unknown>, `${key}_`);
      Object.assign(flattened, nested);
      continue;
    }

    // Для остальных типов преобразуем в строку через JSON
    // Это fallback для неизвестных типов (например, Symbol, BigInt)
    try {
      flattened[key] = JSON.stringify(value);
    } catch {
      // Если JSON.stringify не работает, используем безопасное преобразование
      flattened[key] = `[${typeof value}]`;
    }
  }

  return flattened;
}

/**
 * Рекурсивно расплющивает объект с заданным префиксом
 *
 * Обрабатывает:
 * - Простые вложенные объекты (location, location_of_birth)
 * - Объекты с динамическими ключами (nn_photo_set_ids)
 * - Глубоко вложенные структуры (profile_cover.default_cover, relationship.message_tokens)
 * - Массивы на любом уровне вложенности
 */
function flattenObject(
  obj: Record<string, unknown>,
  prefix: string,
  depth: number = 0,
): Record<string, string | number | boolean | null> {
  const flattened: Record<string, string | number | boolean | null> = {};

  // Защита от бесконечной рекурсии (максимум 10 уровней)
  const MAX_DEPTH = 10;
  if (depth > MAX_DEPTH) {
    // Если превышен лимит глубины, сохраняем весь объект как JSON
    return { [prefix.slice(0, -1)]: JSON.stringify(obj, null, 0) };
  }

  for (const [key, value] of Object.entries(obj)) {
    // Нормализуем ключ (заменяем точки и другие спецсимволы на подчеркивания)
    const normalizedKey = key.replace(/[^a-zA-Z0-9_]/g, '_');
    const fullKey = `${prefix}${normalizedKey}`;

    if (value === null || value === undefined) {
      flattened[fullKey] = null;
      continue;
    }

    // Примитивные типы
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      flattened[fullKey] = value;
      continue;
    }

    // Даты
    if (value instanceof Date) {
      flattened[fullKey] = value.toISOString();
      continue;
    }

    // Массивы - сохраняем как JSON
    // Массивы могут быть:
    // - Примитивов (possible_relations: ["ALL", "BROTHERSISTER"])
    // - Объектов (presents: [{...}], relations: [{...}], profile_buttons: [{...}])
    // - Вложенными в объекты (relationship.message_tokens: [{...}])
    if (Array.isArray(value)) {
      if (value.length === 0) {
        flattened[fullKey] = '[]';
      } else {
        flattened[fullKey] = JSON.stringify(value, null, 0);
      }
      continue;
    }

    // Вложенные объекты - рекурсивно расплющиваем
    // Примеры:
    // - location → location_city, location_country, location_countryCode, location_countryName
    // - profile_cover.default_cover → profile_cover_default_cover_alpha, profile_cover_default_cover_pic_base, etc.
    // - relationship → relationship_first_name, relationship_last_name, relationship_status, relationship_uid
    // - skill.category → skill_category_code, skill_category_name
    if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
      const nested = flattenObject(
        value as Record<string, unknown>,
        `${fullKey}_`,
        depth + 1,
      );
      Object.assign(flattened, nested);
      continue;
    }

    // Остальное - в строку через JSON
    // Это fallback для неизвестных типов (например, Symbol, BigInt)
    try {
      flattened[fullKey] = JSON.stringify(value);
    } catch {
      // Если JSON.stringify не работает, используем безопасное преобразование
      flattened[fullKey] = `[${typeof value}]`;
    }
  }

  return flattened;
}

/**
 * Форматирует значение для ячейки Excel
 */
export function formatCellValue(
  value: string | number | boolean | null | undefined,
): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'boolean') {
    return value ? 'Да' : 'Нет';
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return String(value);
}
