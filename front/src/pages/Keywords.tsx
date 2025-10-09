import { useEffect, useState } from 'react'
import PageTitle from '../components/PageTitle'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'
import KeywordInput from '../components/KeywordInput'
import FileUpload from '../components/FileUpload'
import { useKeywordsStore } from '../stores'
import { getKeywordTableColumns } from '../config/keywordTableColumns'
import type { Keyword } from '../types'

function Keywords() {
  const keywords = useKeywordsStore((state) => state.keywords)
  const addKeyword = useKeywordsStore((state) => state.addKeyword)
  const deleteKeyword = useKeywordsStore((state) => state.deleteKeyword)
  const loadFromFile = useKeywordsStore((state) => state.loadFromFile)
  const fetchKeywords = useKeywordsStore((state) => state.fetchKeywords)
  const isLoading = useKeywordsStore((state) => state.isLoading)
  const [keywordValue, setKeywordValue] = useState('')

  useEffect(() => {
    const loadKeywords = async () => {
      try {
        await fetchKeywords()
      } catch (error) {
        console.error('Failed to fetch keywords', error)
      }
    }

    void loadKeywords()
  }, [fetchKeywords])

  const handleAddKeyword = async () => {
    const isAdded = await addKeyword(keywordValue)
    if (isAdded) {
      setKeywordValue('')
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      await loadFromFile(file)
    } catch (error) {
      console.error('Failed to upload keywords from file', error)
    } finally {
      event.target.value = ''
    }
  }

  const keywordCount = keywords.length
  const hasKeywords = keywordCount > 0

  const tableContent = isLoading ? (
    <p className="rounded-2xl border border-dashed border-border bg-background-secondary/50 px-6 py-8 text-center text-sm text-text-secondary">
      Загрузка ключевых слов...
    </p>
  ) : keywords.length === 0 ? (
    <div className="flex min-h-[200px] items-center justify-center text-text-secondary">
      Нет ключевых слов. Добавьте новое слово или загрузите из файла.
    </div>
  ) : (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {getKeywordTableColumns(deleteKeyword).map((column) => (
              <TableHead key={column.key} className={column.headerClassName}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {keywords.map((keyword, index) => (
            <TableRow key={keyword.id}>
              {getKeywordTableColumns(deleteKeyword).map((column) => (
                <TableCell key={column.key} className={column.cellClassName}>
                  {column.render ? column.render(keyword as Keyword, index) : keyword[column.key as keyof Keyword]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )

  return (
    <div className="flex flex-col gap-8">
      <PageTitle>Ключевые слова</PageTitle>

      <section
        className="grid gap-6 rounded-3xl border border-border bg-gradient-to-br from-accent-primary/10 via-purple-500/10 to-accent-info/10 p-8 shadow-soft-lg transition-colors duration-300 md:grid-cols-[minmax(0,_2fr)_minmax(220px,_1fr)]"
        aria-label="Сводка по ключевым словам"
      >
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-text-primary">Настройте фильтрацию комментариев</h2>
            <p className="max-w-2xl text-sm leading-relaxed text-text-secondary">
              Добавляйте ключевые слова для быстрого отслеживания релевантных комментариев. Вы можете
              ввести слова вручную или загрузить список из файла.
            </p>
          </div>
          <ul className="space-y-2 text-sm text-text-secondary">
            <li>Используйте точные формулировки, чтобы повысить точность поиска.</li>
            <li>Загружайте файлы в формате CSV или TXT для массового добавления слов.</li>
            <li>Удаляйте устаревшие ключевые слова, чтобы поддерживать актуальность фильтра.</li>
          </ul>
        </div>
        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-border/60 bg-background-secondary/70 p-6 text-center shadow-soft-md" aria-live="polite">
          <span className="text-5xl font-bold text-accent-primary">{keywordCount}</span>
          <span className="text-sm font-medium text-text-secondary">
            {hasKeywords ? 'ключевых слов активно' : 'ключевых слов пока нет'}
          </span>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2" aria-label="Управление ключевыми словами">
        <div className="rounded-3xl border border-border bg-background-secondary/80 p-6 shadow-soft-lg transition-colors duration-300">
          <h3 className="text-lg font-semibold text-text-primary">Добавление ключевых слов</h3>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            Введите слово вручную или загрузите готовый список. Поиск обновляется мгновенно при вводе.
          </p>
          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
            <KeywordInput
              value={keywordValue}
              onChange={(e) => setKeywordValue(e.target.value)}
              onAdd={handleAddKeyword}
              placeholder="Поиск и добавление ключевого слова"
            />
            <FileUpload onUpload={handleFileUpload} />
          </div>
        </div>
        <div className="rounded-3xl border border-dashed border-accent-success/40 bg-background-secondary/60 p-6 shadow-soft-md">
          <h3 className="text-lg font-semibold text-text-primary">Советы по работе</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-text-secondary">
            <li>Проверяйте список после импорта, чтобы удалить дубликаты.</li>
            <li>Используйте короткие и понятные формулировки.</li>
            <li>Добавляйте ключевые слова по темам для разных сценариев.</li>
          </ul>
        </div>
      </section>

      <section className="space-y-4" aria-label="Список ключевых слов">
        <div className="overflow-hidden rounded-3xl border border-border bg-background-secondary shadow-soft-lg">
          <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-text-primary">Список ключевых слов</h3>
              <p className="text-sm text-text-secondary">
                {hasKeywords
                  ? 'Управляйте существующими ключевыми словами, чтобы контролировать выдачу комментариев.'
                  : 'Добавьте первое ключевое слово, чтобы начать фильтрацию комментариев.'}
              </p>
            </div>
            {hasKeywords && (
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-primary/10 text-lg font-semibold text-accent-primary">
                {keywordCount}
              </span>
            )}
          </header>
          <div className="px-2 py-4 sm:px-6">{tableContent}</div>
        </div>
      </section>
    </div>
  )
}

export default Keywords

