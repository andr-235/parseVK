// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'coverage', 'coverage-*', '**/*.test.ts', '**/*.test.tsx', '**/__tests__/**']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  // Правила для компонентов модулей - запрет импорта store
  {
    files: ['src/modules/**/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@/store',
              message: 'Компоненты не должны импортировать store напрямую. Используйте хуки модуля.',
            },
          ],
          patterns: [
            {
              group: ['../store', '../../store', '../../../store'],
              message: 'Компоненты не должны импортировать store напрямую. Используйте хуки модуля.',
            },
          ],
        },
      ],
    },
  },
  // Правила для utils - запрет импорта services/store
  {
    files: ['src/utils/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@/services',
              message: 'Utils должны быть чистыми функциями без зависимостей от services.',
            },
            {
              name: '@/store',
              message: 'Utils должны быть чистыми функциями без зависимостей от store.',
            },
          ],
          patterns: [
            {
              group: ['../services/*', '../../services/*'],
              message: 'Utils должны быть чистыми функциями без зависимостей от services.',
            },
            {
              group: ['../store/*', '../../store/*'],
              message: 'Utils должны быть чистыми функциями без зависимостей от store.',
            },
          ],
        },
      ],
    },
  },
])
