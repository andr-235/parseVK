import '@testing-library/jest-dom'

// Глобальный мок для import.meta.env, чтобы Jest мог обрабатывать Vite-специфичные переменные
// Для ESM в Jest нужно определить import.meta через Object.defineProperty
// Это работает, потому что ts-jest трансформирует import.meta в runtime-доступный объект
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      env: {
        DEV: process.env.NODE_ENV !== 'production',
        VITE_API_URL: process.env.VITE_API_URL || '/api',
        VITE_API_WS_URL: process.env.VITE_API_WS_URL || undefined,
      },
    },
  },
  writable: true,
  configurable: true,
})

// Глобальный мок для apiConfig, чтобы избежать проблем с import.meta.env в тестах
jest.mock('@/lib/apiConfig', () => ({
  API_URL: '/api',
}))
