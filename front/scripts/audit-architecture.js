#!/usr/bin/env node

/**
 * Скрипт для аудита архитектуры фронтенд-проекта
 * Проверяет соответствие структуры и правил зависимостей
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const SRC_DIR = join(__dirname, '..', 'src')

const errors = []
const warnings = []

// Стандартные папки модуля
const MODULE_REQUIRED_DIRS = ['components', 'hooks']
const MODULE_OPTIONAL_DIRS = ['config', 'types', 'utils', 'constants']

// Запрещенные импорты
const FORBIDDEN_IMPORTS = {
  'modules/**/components/**/*.{ts,tsx}': [
    { pattern: /from ['"]@\/store/, message: 'Компоненты не должны импортировать store напрямую' },
    { pattern: /from ['"]\.\.\/store/, message: 'Компоненты не должны импортировать store напрямую' },
  ],
  'utils/**/*.{ts,tsx}': [
    { pattern: /from ['"]@\/services/, message: 'Utils должны быть чистыми функциями без зависимостей от services' },
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
  const relativeImportPattern = /from ['"]\.\.\/+/
  const matches = content.match(relativeImportPattern)

  if (matches) {
    // Исключаем импорты внутри модулей (они должны использовать @/)
    if (filePath.includes('/modules/')) {
      errors.push({
        file: filePath.replace(SRC_DIR, ''),
        message: 'Модули должны использовать alias @/ вместо относительных импортов',
        line: content.substring(0, content.indexOf(matches[0])).split('\n').length,
      })
    }
  }
}

function checkForbiddenImports(filePath, content) {
  const relativePath = filePath.replace(SRC_DIR, '')

  // Проверка для компонентов модулей
  if (relativePath.match(/modules\/[^/]+\/components\/.+\.[tj]sx?$/)) {
    FORBIDDEN_IMPORTS['modules/**/components/**/*.{ts,tsx}'].forEach(({ pattern, message }) => {
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
  if (relativePath.match(/^\/utils\/.+\.[tj]sx?$/)) {
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
}

function checkModuleStructure(modulePath, moduleName) {
  const requiredDirs = MODULE_REQUIRED_DIRS.filter((dir) => !existsSync(join(modulePath, dir)))

  if (requiredDirs.length > 0) {
    errors.push({
      file: `modules/${moduleName}/`,
      message: `Отсутствуют обязательные папки: ${requiredDirs.join(', ')}`,
    })
  }

  // Проверка на наличие types.ts вместо types/
  const typesFile = join(modulePath, 'types.ts')
  if (existsSync(typesFile)) {
    warnings.push({
      file: `modules/${moduleName}/types.ts`,
      message: 'Рекомендуется использовать папку types/ вместо файла types.ts для единообразия',
    })
  }
}

function auditArchitecture() {
  console.log('🔍 Запуск аудита архитектуры...\n')

  // Проверка структуры модулей
  const modulesDir = join(SRC_DIR, 'modules')
  if (existsSync(modulesDir)) {
    const modules = readdirSync(modulesDir).filter((item) => {
      const itemPath = join(modulesDir, item)
      return statSync(itemPath).isDirectory()
    })

    modules.forEach((moduleName) => {
      const modulePath = join(modulesDir, moduleName)
      checkModuleStructure(modulePath, moduleName)
    })
  }

  // Проверка импортов
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
    console.log('✅ Все проверки пройдены успешно!\n')
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
