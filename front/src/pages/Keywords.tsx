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
    <div>
      <PageTitle>Ключевые слова</PageTitle>

      <div className="keywords-controls">
        <KeywordInput
          value={keywordValue}
          onChange={(e) => setKeywordValue(e.target.value)}
          onAdd={handleAddKeyword}
          placeholder="Поиск и добавление ключевого слова"
        />
        <FileUpload onUpload={handleFileUpload} />
      </div>

      {tableContent}
    </div>
  )
}

export default Keywords

