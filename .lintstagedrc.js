module.exports = {
  // Backend: строгая проверка TypeScript файлов
  'api/**/*.ts': [
    // 1. Автоматическое форматирование
    'bash -c "cd api && npm run format"',
    // 2. Линтинг с автоФиксом и блокировкой при предупреждениях
    'bash -c "cd api && npx eslint --fix --max-warnings=0"',
    // 3. Проверка типов TypeScript (только для измененных файлов)
    'bash -c "cd api && npx tsc --noEmit --pretty false"',
  ],
  // Тестовые файлы: только форматирование (типы проверяются в основном коде)
  'api/**/*.spec.ts': [
    'bash -c "cd api && npm run format"',
  ],
  // Frontend: строгая проверка TypeScript/TSX файлов
  'front/**/*.{ts,tsx}': [
    // 1. Автоматическое форматирование
    'bash -c "cd front && npm run format"',
    // 2. Линтинг с автоФиксом и блокировкой при предупреждениях
    'bash -c "cd front && npx eslint --fix --max-warnings=0"',
    // 3. Проверка типов TypeScript (только для измененных файлов)
    'bash -c "cd front && npx tsc --noEmit --pretty false"',
  ],
  // CSS файлы: только форматирование
  'front/**/*.css': [
    'bash -c "cd front && npm run format"',
  ],
  // Конфигурационные файлы: форматирование
  '*.{json,md,yml,yaml}': [
    'npx prettier --write',
  ],
};

