module.exports = {
  // Backend: строгая проверка TypeScript файлов
  'api/**/*.ts': [
    // 1. Автоматическое форматирование
    'bash -c "cd api && npm run format"',
    // 2. Линтинг с автоФиксом и блокировкой при предупреждениях (только для измененных файлов)
    (filenames) => {
      const relativePaths = filenames
        .map((f) => {
          const match = f.match(/(?:^|\/)api\/(.+)$/);
          if (match) {
            const path = match[1];
            return path.startsWith('src/') ? path : `src/${path}`;
          }
          return f.replace(/^api\//, 'src/');
        })
        .join(' ');
      return `bash -c "cd api && npx eslint --fix --max-warnings=0 ${relativePaths}"`;
    },
  ],
  // Тестовые файлы: только форматирование
  'api/**/*.spec.ts': [
    'bash -c "cd api && npm run format"',
    (filenames) => {
      const relativePaths = filenames
        .map((f) => {
          const match = f.match(/(?:^|\/)api\/(.+)$/);
          if (match) {
            const path = match[1];
            return path.startsWith('src/') ? path : `src/${path}`;
          }
          return f.replace(/^api\//, 'src/');
        })
        .join(' ');
      return `bash -c "cd api && npx eslint --fix --max-warnings=0 ${relativePaths}"`;
    },
  ],
  // Frontend: строгая проверка TypeScript/TSX файлов (исключая тесты)
  'front/**/*.{ts,tsx}': [
    // Фильтруем тестовые файлы и пропускаем, если остались только тесты
    (filenames) => {
      const nonTestFiles = filenames.filter(
        (f) => !f.includes('__tests__') && !f.includes('.test.')
      );
      return nonTestFiles;
    },
    // 1. Автоматическое форматирование
    'bash -c "cd front && npm run format"',
    // 2. Линтинг с автоФиксом и блокировкой при предупреждений (только для измененных файлов)
    (filenames) => {
      if (!filenames || filenames.length === 0) {
        return 'echo "No files to lint"'; // Пропускаем, если нет файлов
      }
      const relativePaths = filenames
        .map((f) => {
          const match = f.match(/(?:^|\/)front\/(.+)$/);
          if (match) {
            const path = match[1];
            return path.startsWith('src/') ? path : `src/${path}`;
          }
          return f.replace(/^front\//, 'src/');
        })
        .join(' ');
      return `bash -c "cd front && npx eslint --fix --max-warnings=0 --no-warn-ignored ${relativePaths}"`;
    },
  ],
  // Тестовые файлы frontend: только форматирование
  'front/**/__tests__/**/*.{ts,tsx}': [
    'bash -c "cd front && npm run format"',
  ],
  'front/**/*.test.{ts,tsx}': [
    'bash -c "cd front && npm run format"',
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
