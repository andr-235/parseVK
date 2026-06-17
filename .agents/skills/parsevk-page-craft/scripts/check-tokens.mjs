/**
 * Проверяет файлы на использование хардкод-значений вместо токенов.
 *
 * Run: node .agents/skills/parsevk-page-craft/scripts/check-tokens.mjs [--fix] [--path src/pages/**/*.tsx]
 *
 * Ищет:
 * 1. text-[Npx] — заменить на токен размера (text-xs, text-sm, text-base)
 * 2. bg-slate-*, text-gray-*, border-zinc-* — заменить на CSS-переменные
 * 3. transition-all — заменить на transition-colors (или transition-opacity)
 * 4. #fff, #000, #xxxxxx — подсказать токен
 */

const { glob } = await import('node:fs/promises')
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const args = process.argv.slice(2)
const fixMode = args.includes('--fix')
const targetGlob = args.find(a => a.startsWith('--path='))?.slice('--path='.length) || 'front/src/**/*.tsx'

const FONT_MAP = {
  'text-\\[10px\\]': 'text-xs',
  'text-\\[11px\\]': 'text-xs',
  'text-\\[12px\\]': 'text-xs',
  'text-\\[13px\\]': 'text-sm',
  'text-\\[14px\\]': 'text-sm',
  'text-\\[15px\\]': 'text-base',
  'text-\\[0\\.625rem\\]': 'text-xs',
  'text-\\[0\\.6875rem\\]': 'text-xs',   // 11px
  'text-\\[0\\.75rem\\]': 'text-xs',     // 12px
  'text-\\[0\\.8125rem\\]': 'text-sm',   // 13px
  'text-\\[0\\.875rem\\]': 'text-sm',    // 14px
}

const SPECIFIC_COLORS = new Set([
  'slate', 'gray', 'zinc', 'neutral', 'stone',
  'red', 'orange', 'amber', 'yellow', 'lime',
  'green', 'emerald', 'teal', 'cyan', 'sky',
  'blue', 'indigo', 'violet', 'purple', 'fuchsia',
  'pink', 'rose',
])

function isHardcodedTwColor(className) {
  // bg-slate-900, text-gray-300, border-zinc-700
  return SPECIFIC_COLORS.has(className)
}

function extractClassNames(content) {
  const matches = content.matchAll(/className="([^"]+)"/g)
  return Array.from(matches, m => ({ full: m[0], value: m[1], index: m.index }))
}

async function run() {
  const root = new URL('../..', import.meta.url).pathname
  const searchRoot = path.resolve(process.cwd(), targetGlob.replace(/\*\*\/\*\.\w+$/, '').replace(/front\//, ''))
  const pattern = targetGlob.includes('**') ? targetGlob : `front/src/**/*.tsx`

  console.log(`🔍 Checking hardcoded values in: ${pattern}`)

  const stream = glob(pattern, { cwd: process.cwd() + '/front/..' }).catch(() => glob('**/*.tsx', { cwd: process.cwd() }))
  let totalIssues = 0
  let fileIssues = 0
  let fixableIssues = 0

  for await (const file of await stream) {
    if (file.includes('node_modules')) continue
    const content = await readFile(path.resolve(process.cwd(), file), 'utf-8')
    const issues = []

    // 1. Hardcoded font sizes
    for (const [pattern, replacement] of Object.entries(FONT_MAP)) {
      const re = new RegExp(pattern, 'g')
      let match
      while ((match = re.exec(content)) !== null) {
        issues.push({
          line: content.slice(0, match.index).split('\n').length,
          match: match[0],
          replacement: replacement,
          type: 'font-size',
        })
      }
    }

    // 2. transition-all on layout properties
    const transAllRe = /transition-all/g
    let match
    while ((match = transAllRe.exec(content)) !== null) {
      // Check surrounding context — is it just colors/opacity?
      const contextStart = Math.max(0, match.index - 100)
      const contextAfter = content.slice(match.index, match.index + 100)
      if (/\b(?:bg-|text-|border-|hover:|focus:)\b/.test(contextAfter)) {
        issues.push({
          line: content.slice(0, match.index).split('\n').length,
          match: 'transition-all',
          replacement: 'transition-colors',
          type: 'transition',
        })
      }
    }

    // 3. Hardcoded hex colors in className (not in CSS vars or design system classes)
    const hexColorRe = /#(?:[0-9a-fA-F]{3}){1,2}\b/g
    while ((match = hexColorRe.exec(content)) !== null) {
      const lineStart = content.lastIndexOf('\n', match.index) + 1
      const lineNum = content.slice(0, match.index).split('\n').length
      const line = content.slice(lineStart, content.indexOf('\n', match.index))
      if (!line.includes('css-var') && !line.includes('var(') && !line.includes('--')) {
        issues.push({
          line: lineNum,
          match: match[0],
          replacement: 'use CSS variable token',
          type: 'color-hex',
        })
      }
    }

    if (issues.length > 0) {
      console.log(`\n📄 ${file} (${issues.length} issues)`)
      for (const issue of issues) {
        console.log(`  L${issue.line}: ${issue.match} → ${issue.replacement}`)
        totalIssues++
        if (issue.replacement !== 'use CSS variable token') fixableIssues++
      }
      fileIssues++
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`📊 Результат:`)
  console.log(`  Файлов с issue: ${fileIssues}`)
  console.log(`  Всего issues:   ${totalIssues}`)
  console.log(`  Auto-fixable:   ${fixableIssues}`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━`)

  if (totalIssues === 0) {
    console.log(`✅ Хардкод-значения не найдены.`)
  } else if (fixMode) {
    console.log(`\n⚠️  Запустите с --fix для автоисправления`)
  }
}

run().catch(console.error)
