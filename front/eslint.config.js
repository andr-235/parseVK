import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
<<<<<<< HEAD
  globalIgnores(['dist', 'coverage', 'coverage-watchlist']),
=======
  globalIgnores(['dist']),
>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
<<<<<<< HEAD
=======
      reactHooks.configs.flat.recommended,
>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
<<<<<<< HEAD
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
=======
>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da
  },
])
