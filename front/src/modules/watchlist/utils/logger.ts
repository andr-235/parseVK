/**
 * Простая утилита логирования для фронтенда.
 * В будущем можно заменить на более продвинутую библиотеку логирования.
 */

export interface Logger {
  warn: (message: string, ...args: any[]) => void
  error: (message: string, ...args: any[]) => void
  info: (message: string, ...args: any[]) => void
  debug: (message: string, ...args: any[]) => void
}

const createLogger = (): Logger => {
  const isDevelopment = import.meta.env.DEV

  return {
    warn: (message: string, ...args: any[]) => {
      if (isDevelopment) {
        console.warn(`[WARN] ${message}`, ...args)
      }
      // В продакшене можно отправлять логи на сервер
    },
    error: (message: string, ...args: any[]) => {
      console.error(`[ERROR] ${message}`, ...args)
      // В продакшене можно отправлять логи на сервер
    },
    info: (message: string, ...args: any[]) => {
      if (isDevelopment) {
        console.info(`[INFO] ${message}`, ...args)
      }
    },
    debug: (message: string, ...args: any[]) => {
      if (isDevelopment) {
        console.debug(`[DEBUG] ${message}`, ...args)
      }
    },
  }
}

export const logger = createLogger()

