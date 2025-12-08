const tsJest = require('ts-jest').default

module.exports = {
  process(sourceText, sourcePath, options) {
    // Заменяем import.meta.env на объект с переменными окружения
    const transformedSource = sourceText.replace(
      /import\.meta\.env\.([A-Z_]+)/g,
      (match, envVar) => {
        const envMap = {
          DEV: 'process.env.NODE_ENV !== "production"',
          VITE_API_URL: 'process.env.VITE_API_URL || "/api"',
          VITE_API_WS_URL: 'process.env.VITE_API_WS_URL || undefined',
        }
        return envMap[envVar] || 'undefined'
      }
    ).replace(
      /import\.meta\.env/g,
      '{ DEV: process.env.NODE_ENV !== "production", VITE_API_URL: process.env.VITE_API_URL || "/api", VITE_API_WS_URL: process.env.VITE_API_WS_URL || undefined }'
    )

    // Используем ts-jest для трансформации
    const tsJestTransformer = tsJest.createTransformer({
      useESM: true,
      tsconfig: options.tsconfig || 'tsconfig.test.json',
      diagnostics: false,
    })

    return tsJestTransformer.process(transformedSource, sourcePath, options)
  },
  getCacheKey(sourceText, sourcePath, options) {
    const tsJestTransformer = tsJest.createTransformer({
      useESM: true,
      tsconfig: options.tsconfig || 'tsconfig.test.json',
      diagnostics: false,
    })
    return tsJestTransformer.getCacheKey(sourceText, sourcePath, options)
  },
}

