// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'
import boundaries from 'eslint-plugin-boundaries'

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
  // Правила для компонентов - запрет импорта store
  {
    files: ['src/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@/store',
              message: 'Компоненты не должны импортировать store напрямую. Используйте хуки.',
            },
          ],
          patterns: [
            {
              group: ['**/store', '**/store/*', '@/store/*'],
              message: 'Компоненты не должны импортировать store напрямую. Используйте хуки.',
            },
          ],
        },
      ],
    },
  },
  // Правила для utils - запрет импорта api/store
  {
    files: ['src/utils/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@/api',
              message: 'Utils должны быть чистыми функциями без зависимостей от API.',
            },
            {
              name: '@/store',
              message: 'Utils должны быть чистыми функциями без зависимостей от store.',
            },
          ],
          patterns: [
            {
              group: ['**/api', '**/api/*', '@/api/*'],
              message: 'Utils должны быть чистыми функциями без зависимостей от API.',
            },
            {
              group: ['**/store', '**/store/*', '@/store/*'],
              message: 'Utils должны быть чистыми функциями без зависимостей от store.',
            },
          ],
        },
      ],
    },
  },
  // Архитектурные границы
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
        },
      },
      'boundaries/include': ['src/**/*.{ts,tsx}'],
      'boundaries/elements': [
        {
          type: 'component-feature',
          pattern: 'src/components/!(ui|common|__tests__)/',
          capture: ['name'],
        },
        {
          type: 'hook-feature',
          pattern: 'src/hooks/!(common|__tests__)/',
          capture: ['name'],
        },
        {
          type: 'pages',
          pattern: 'src/pages/**',
        },
        {
          type: 'app-types',
          pattern: 'src/types/**',
        },
      ],
    },
    rules: {
      // Компоненты фич не должны импортировать из других фич
      'boundaries/element-types': [
        'error',
        {
          default: 'allow',
          rules: [
            {
              from: ['component-feature'],
              disallow: [
                ['component-feature', { name: '!${from.name}' }],
                ['hook-feature', { name: '!${from.name}' }],
              ],
              message: 'Компоненты фичи "${from.name}" не должны зависеть от компонентов или хуков другой фичи "${to.name}".',
            },
            {
              from: ['hook-feature'],
              disallow: [
                ['component-feature', { name: '*' }],
                ['hook-feature', { name: '!${from.name}' }],
              ],
              message: 'Хуки фичи "${from.name}" не должны зависеть от компонентов или хуков другой фичи "${to.name}".',
            },
          ],
        },
      ],
    },
  },
])
