import '@testing-library/jest-dom'

// Глобальный мок для apiConfig, чтобы избежать проблем с import.meta.env в тестах
jest.mock('@/lib/apiConfig', () => ({
  API_URL: '/api',
}))
