const quoteForShell = (value) => `'${value.replace(/'/g, "'\\''")}'`;

const toProjectRelativePaths = (prefix, filenames) =>
  filenames.map((file) => {
    const match = file.match(new RegExp(`(?:^|/)${prefix}/(.+)$`));
    if (match) {
      return match[1];
    }

    return file.replace(new RegExp(`^${prefix}/`), '');
  });

module.exports = {
  'api/**/*.ts': (filenames) => {
    const relativePaths = toProjectRelativePaths('api', filenames)
      .map(quoteForShell)
      .join(' ');

    return [
      `bash -c "cd api && npx prettier --write ${relativePaths}"`,
      `bash -c "cd api && npx eslint --fix --max-warnings=0 ${relativePaths}"`,
    ];
  },
  'front/**/*.{ts,tsx}': (filenames) => {
    const nonTestFiles = filenames.filter(
      (file) => !file.includes('__tests__') && !file.includes('.test.'),
    );

    if (nonTestFiles.length === 0) {
      return [];
    }

    const relativePaths = toProjectRelativePaths('front', nonTestFiles)
      .map(quoteForShell)
      .join(' ');

    return [
      `bash -c "cd front && npx prettier --write ${relativePaths}"`,
      `bash -c "cd front && npx eslint --fix --max-warnings=0 --no-warn-ignored ${relativePaths}"`,
    ];
  },
  'front/**/__tests__/**/*.{ts,tsx}': (filenames) => {
    const relativePaths = toProjectRelativePaths('front', filenames)
      .map(quoteForShell)
      .join(' ');

    return [`bash -c "cd front && npx prettier --write ${relativePaths}"`];
  },
  'front/**/*.test.{ts,tsx}': (filenames) => {
    const relativePaths = toProjectRelativePaths('front', filenames)
      .map(quoteForShell)
      .join(' ');

    return [`bash -c "cd front && npx prettier --write ${relativePaths}"`];
  },
  'front/**/*.css': (filenames) => {
    const relativePaths = toProjectRelativePaths('front', filenames)
      .map(quoteForShell)
      .join(' ');

    return [`bash -c "cd front && npx prettier --write ${relativePaths}"`];
  },
  '*.{json,md,yml,yaml}': ['npx prettier --write'],
};
