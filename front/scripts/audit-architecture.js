#!/usr/bin/env node

/**
 * Скрипт для аудита архитектуры фронтенд-проекта (Слоистая архитектура)
 * Проверяет соответствие структуры и правил зависимостей
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs'
import { join, dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const SRC_DIR = resolve(__dirname, '..', 'src')

const errors = []
const warnings = []

// Разрешенные папки на верхнем уровне src/
const ALLOWED_SRC_DIRS = ['app', 'pages', 'components', 'hooks', 'api', 'store', 'utils', 'types', 'config']

// Запрещенные импорты
const FORBIDDEN_IMPORTS = {
  'components/**/*.{ts,tsx}': [
    { pattern: /from ['"]@\/store/, message: 'Компоненты не должны импортировать store напрямую' },
  ],
  'utils/**/*.{ts,tsx}': [
    { pattern: /from ['"]@\/api/, message: 'Utils должны быть чистыми функциями без зависимостей от api' },
    { pattern: /from ['"]@\/store/, message: 'Utils должны быть чистыми функциями без зависимостей от store' },
  ],
}

function getAllFiles(dir, fileList = []) {
  const files = readdirSync(dir)

  files.forEach((file) => {
    const filePath = join(dir, file)
    const stat = statSync(filePath)

    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        getAllFiles(filePath, fileList)
      }
    } else if (/\.(ts|tsx)$/.test(file)) {
      fileList.push(filePath)
    }
  })

  return fileList
}

function checkRelativeImports(filePath, content) {
  // Ищем относительные импорты вида: from '../...' или from '../../...'
  const relativeImportPattern = /from\s+['"](\.\.[^'"]+)['"]/g
  let match

  while ((match = relativeImportPattern.exec(content)) !== null) {
    const relImport = match[1]
    const absImportPath = resolve(dirname(filePath), relImport)
    
    const fileRelPath = filePath.replace(SRC_DIR, '').replace(/\\/g, '/')
    const importRelPath = absImportPath.replace(SRC_DIR, '').replace(/\\/g, '/')
    
    // Получаем имя слоя текущего файла и импортируемого файла (например, 'components' или 'hooks')
    const fileLayer = fileRelPath.split('/')[1]
    const importLayer = importRelPath.split('/')[1]
    
    // Если слои отличаются, это нарушение (нельзя импортировать из components в hooks по относительному пути)
    if (fileLayer && importLayer && fileLayer !== importLayer) {
      errors.push({
        file: fileRelPath,
        message: `Запрещено импортировать между разными слоями по относительному пути (${fileLayer} -> ${importLayer}). Используйте alias @/`,
        line: content.substring(0, match.index).split('\n').length,
      })
    }
  }
}

function checkForbiddenImports(filePath, content) {
  const relativePath = filePath.replace(SRC_DIR, '').replace(/\\/g, '/')

  // Проверка для компонентов
  if (relativePath.startsWith('/components/')) {
    FORBIDDEN_IMPORTS['components/**/*.{ts,tsx}'].forEach(({ pattern, message }) => {
      if (pattern.test(content)) {
        const line = content.split('\n').findIndex((line) => pattern.test(line)) + 1
        errors.push({
          file: relativePath,
          message,
          line,
        })
      }
    })
  }

  // Проверка для utils
  if (relativePath.startsWith('/utils/')) {
    FORBIDDEN_IMPORTS['utils/**/*.{ts,tsx}'].forEach(({ pattern, message }) => {
      if (pattern.test(content)) {
        const line = content.split('\n').findIndex((line) => pattern.test(line)) + 1
        errors.push({
          file: relativePath,
          message,
          line,
        })
      }
    })
  }

  // Проверка на использование старых путей @/shared/ и @/modules/
  const legacySharedPattern = /from ['"]@\/shared/
  const legacyModulesPattern = /from ['"]@\/modules/
  
  if (legacySharedPattern.test(content)) {
    const line = content.split('\n').findIndex((line) => legacySharedPattern.test(line)) + 1
    errors.push({
      file: relativePath,
      message: 'Обнаружен устаревший импорт из @/shared. Используйте новые слои (@/components/ui, @/components/common, @/hooks/common и т.д.)',
      line,
    })
  }

  if (legacyModulesPattern.test(content)) {
    const line = content.split('\n').findIndex((line) => legacyModulesPattern.test(line)) + 1
    errors.push({
      file: relativePath,
      message: 'Обнаружен устаревший импорт из @/modules. Используйте новые слои (@/components/{feature}, @/hooks/{feature} и т.g.)',
      line,
    })
  }
}

function checkSrcStructure() {
  if (!existsSync(SRC_DIR)) return

  const items = readdirSync(SRC_DIR)
  items.forEach((item) => {
    const itemPath = join(SRC_DIR, item)
    if (statSync(itemPath).isDirectory()) {
      if (!ALLOWED_SRC_DIRS.includes(item)) {
        errors.push({
          file: `src/${item}/`,
          message: `Папка не разрешена на верхнем уровне src/. Разрешенные папки: ${ALLOWED_SRC_DIRS.join(', ')}`,
        })
      }
    }
  })
}

function auditArchitecture() {
  console.log('🔍 Запуск аудита новой архитектуры...\n')

  // Проверка папок на верхнем уровне src/
  checkSrcStructure()

  // Проверка импортов во всех файлах
  const files = getAllFiles(SRC_DIR)

  files.forEach((filePath) => {
    try {
      const content = readFileSync(filePath, 'utf-8')
      checkRelativeImports(filePath, content)
      checkForbiddenImports(filePath, content)
    } catch (error) {
      console.error(`Ошибка при чтении файла ${filePath}:`, error.message)
    }
  })

  // Вывод результатов
  console.log('📊 Результаты аудита:\n')

  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ Все проверки новой архитектуры пройдены успешно!\n')
    return 0
  }

  if (errors.length > 0) {
    console.log(`❌ Найдено ошибок: ${errors.length}\n`)
    errors.forEach((error) => {
      console.log(`  ${error.file}:${error.line || ''}`)
      console.log(`    ${error.message}\n`)
    })
  }

  if (warnings.length > 0) {
    console.log(`⚠️  Найдено предупреждений: ${warnings.length}\n`)
    warnings.forEach((warning) => {
      console.log(`  ${warning.file}`)
      console.log(`    ${warning.message}\n`)
    })
  }

  return errors.length > 0 ? 1 : 0
}

const exitCode = auditArchitecture()
process.exit(exitCode)
