// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.vitest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  // Межмодульные границы: запрещаем прямые импорты внутренних сервисов между модулями
  // Внешние модули должны использовать фасадные сервисы, а не внутренние реализации.
  {
    files: ['src/**/*.ts'],
    ignores: [
      'src/watchlist/**',
      '**/*.spec.ts',
      '**/*.module.ts',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/watchlist/services/watchlist-author.service*', '**/watchlist/services/watchlist-settings.service*'],
              message: 'Используйте WatchlistService (фасад) вместо прямого импорта внутренних watchlist-сервисов.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/**/*.ts'],
    ignores: [
      'src/data-import/**',
      '**/*.spec.ts',
      '**/*.module.ts',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/data-import/services/listing-validator*', '**/data-import/services/listing-normalizer*'],
              message: 'ListingValidatorService и ListingNormalizerService являются внутренними для модуля data-import.',
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.spec.ts',
      'vitest.config.ts',
      'vitest.e2e.config.ts',
      'vitest.setup.ts',
    ],
    rules: {
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/unbound-method': 'off',
    },
  },
);
