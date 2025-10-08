import { useEffect, useState } from 'react'
import PageTitle from '../components/PageTitle'
import Table from '../components/Table'
import KeywordInput from '../components/KeywordInput'
import FileUpload from '../components/FileUpload'
import { useKeywordsStore } from '../stores'
import { getKeywordTableColumns } from '../config/keywordTableColumns'

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
    <p className="empty-message">Загрузка ключевых слов...</p>
  ) : (
    <Table
      columns={getKeywordTableColumns(deleteKeyword)}
      data={keywords}
      searchTerm={keywordValue}
      emptyMessage="Нет ключевых слов. Добавьте новое слово или загрузите из файла."
    />
  )

  return (
    <div className="keywords-page">
      <PageTitle>Ключевые слова</PageTitle>

      <section className="keywords-hero" aria-label="Сводка по ключевым словам">
        <div className="keywords-hero__intro">
          <h2 className="keywords-hero__title">Настройте фильтрацию комментариев</h2>
          <p className="keywords-hero__description">
            Добавляйте ключевые слова для быстрого отслеживания релевантных комментариев. Вы можете
            ввести слова вручную или загрузить список из файла.
          </p>
          <ul className="keywords-hero__tips">
            <li>Используйте точные формулировки, чтобы повысить точность поиска.</li>
            <li>Загружайте файлы в формате CSV или TXT для массового добавления слов.</li>
            <li>Удаляйте устаревшие ключевые слова, чтобы поддерживать актуальность фильтра.</li>
          </ul>
        </div>
        <div className="keywords-hero__stats" aria-live="polite">
          <span className="keywords-hero__count">{keywordCount}</span>
          <span className="keywords-hero__label">
            {hasKeywords ? 'ключевых слов активно' : 'ключевых слов пока нет'}
          </span>
        </div>
      </section>

      <section className="keywords-actions" aria-label="Управление ключевыми словами">
        <div className="keywords-actions__card">
          <h3 className="keywords-actions__title">Добавление ключевых слов</h3>
          <p className="keywords-actions__subtitle">
            Введите слово вручную или загрузите готовый список. Поиск обновляется мгновенно при вводе.
          </p>
          <div className="keywords-actions__controls">
            <KeywordInput
              value={keywordValue}
              onChange={(e) => setKeywordValue(e.target.value)}
              onAdd={handleAddKeyword}
              placeholder="Поиск и добавление ключевого слова"
            />
            <FileUpload onUpload={handleFileUpload} />
          </div>
        </div>
        <div className="keywords-actions__card keywords-actions__card--hint">
          <h3 className="keywords-actions__title">Советы по работе</h3>
          <ul className="keywords-actions__list">
            <li>Проверяйте список после импорта, чтобы удалить дубликаты.</li>
            <li>Используйте короткие и понятные формулировки.</li>
            <li>Добавляйте ключевые слова по темам для разных сценариев.</li>
          </ul>
        </div>
      </section>

      <section className="keywords-table-section" aria-label="Список ключевых слов">
        <div className="keywords-table-card">
          <header className="keywords-table-card__header">
            <div>
              <h3 className="keywords-table-card__title">Список ключевых слов</h3>
              <p className="keywords-table-card__description">
                {hasKeywords
                  ? 'Управляйте существующими ключевыми словами, чтобы контролировать выдачу комментариев.'
                  : 'Добавьте первое ключевое слово, чтобы начать фильтрацию комментариев.'}
              </p>
            </div>
            {hasKeywords && (
              <span className="keywords-table-card__badge">{keywordCount}</span>
            )}
          </header>
          <div className="keywords-table-card__body">{tableContent}</div>
        </div>
      </section>
    </div>
  )
}

export default Keywords

