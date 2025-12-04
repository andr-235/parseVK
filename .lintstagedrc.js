module.exports = {
  // Backend: строгая проверка TypeScript файлов
  'api/**/*.ts': [
    // 1. Автоматическое форматирование
    'bash -c "cd api && npm run format"',
    // 2. Линтинг с автоФиксом и блокировкой при предупреждениях (только для измененных файлов)
    (filenames) => {
      const relativePaths = filenames.map(f => f.replace(/^api\//, 'src/')).join(' ');
      return `bash -c "cd api && npx eslint --fix --max-warnings=0 ${relativePaths}"`;
    },
  ],
  // Тестовые файлы: только форматирование
  'api/**/*.spec.ts': [
    'bash -c "cd api && npm run format"',
    (filenames) => {
      const relativePaths = filenames.map(f => f.replace(/^api\//, 'src/')).join(' ');
      return `bash -c "cd api && npx eslint --fix --max-warnings=0 ${relativePaths}"`;
    },
  ],
  // Frontend: строгая проверка TypeScript/TSX файлов
  'front/**/*.{ts,tsx}': [
    // 1. Автоматическое форматирование
    'bash -c "cd front && npm run format"',
    // 2. Линтинг с автоФиксом и блокировкой при предупреждений (только для измененных файлов)
    (filenames) => {
      const relativePaths = filenames.map(f => f.replace(/^front\//, 'src/')).join(' ');
      return `bash -c "cd front && npx eslint --fix --max-warnings=0 ${relativePaths}"`;
    },
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

