/**
 * Scaffolds a new page following parseVK conventions.
 *
 * Run: node .agents/skills/parsevk-page-craft/scripts/scaffold-page.mjs <page-name>
 *
 * Пример: node scaffold-page.mjs telegram-dl-upload
 *
 * Создаёт:
 *   pages/telegram-dl-upload/
 *   ├── index.ts
 *   ├── TelegramDlUploadPage.tsx
 *   ├── components/
 *   ├── hooks/
 *   ├── config/
 *   └── utils/
 */

import { mkdir, writeFile, access } from 'node:fs/promises'
import path from 'node:path'

const args = process.argv.slice(2)
const pageName = args[0]
if (!pageName) {
  console.error('❌ Usage: node scaffold-page.mjs <page-name-kebab-case>')
  process.exit(1)
}

const pagesDir = path.resolve(process.cwd(), 'front/src/pages')
const dirName = pageName
const componentName = toPascalCase(pageName)

async function exists(p) {
  try { await access(p); return true } catch { return false }
}

async function main() {
  const pageDir = path.join(pagesDir, dirName)

  if (await exists(pageDir)) {
    console.error(`❌ Директория уже существует: ${pageDir}`)
    process.exit(1)
  }

  await mkdir(path.join(pageDir, 'components'), { recursive: true })
  await mkdir(path.join(pageDir, 'hooks'), { recursive: true })
  await mkdir(path.join(pageDir, 'config'), { recursive: true })
  await mkdir(path.join(pageDir, 'utils'), { recursive: true })

  // index.ts
  await writeFile(path.join(pageDir, 'index.ts'), `export { ${componentName}Page } from './${componentName}Page'\n`)

  // Page.tsx
  await writeFile(path.join(pageDir, `${componentName}Page.tsx`), `import { PageContainer, PageHeader } from '@/shared/ui/common'
import { use${componentName} } from './hooks/use${componentName}'

interface ${componentName}PageProps {
  className?: string
}

export const ${componentName}Page = ({ className }: ${componentName}PageProps) => {
  const { data, isLoading } = use${componentName}()

  return (
    <PageContainer maxWidth="1600px" animate={false}>
      <PageHeader
        title="${toLabel(pageName)}"
        description="Управление и мониторинг."
      />

      <div className="flex flex-col gap-8">
        {/* Content sections */}
      </div>
    </PageContainer>
  )
}
`)

  // use{ComponentName}.ts
  await writeFile(path.join(pageDir, `hooks/use${componentName}.ts`), `import { useState, useEffect } from 'react'

interface ${componentName}Data {
  // TODO: define data shape
}

export const use${componentName} = () => {
  const [data, setData] = useState<${componentName}Data | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // TODO: fetch data
    setIsLoading(false)
  }, [])

  return { data, isLoading, error }
}
`)

  console.log(`✅ Страница ${componentName}Page создана:`)
  console.log(`   ${pageDir}`)
  console.log(`   ${pageDir}\\index.ts`)
  console.log(`   ${pageDir}\\${componentName}Page.tsx`)
  console.log(`   ${pageDir}\\hooks\\use${componentName}.ts`)
  console.log(`   ${pageDir}\\components\\`)
  console.log(`   ${pageDir}\\config\\`)
  console.log(`   ${pageDir}\\utils\\`)
}

main().catch(console.error)

function toPascalCase(kebab) {
  return kebab
    .split('-')
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join('')
}

function toLabel(kebab) {
  return kebab
    .split('-')
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ')
}
