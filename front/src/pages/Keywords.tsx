import { useEffect, useState, useMemo, type ChangeEvent } from 'react'
import toast from 'react-hot-toast'
import { useKeywordsStore } from '../stores'
import { keywordsApi } from '../api/keywordsApi'
import KeywordsTableCard from './Keywords/components/KeywordsTableCard'
import PageTitle from '../components/PageTitle'
import FileUpload from '../components/FileUpload'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { Plus, RefreshCw } from 'lucide-react'

function Keywords() {
  const keywords = useKeywordsStore((state) => state.keywords)
  const addKeyword = useKeywordsStore((state) => state.addKeyword)
  const deleteKeyword = useKeywordsStore((state) => state.deleteKeyword)
  const loadFromFile = useKeywordsStore((state) => state.loadFromFile)
  const fetchKeywords = useKeywordsStore((state) => state.fetchKeywords)
  const isLoading = useKeywordsStore((state) => state.isLoading)

  const [keywordValue, setKeywordValue] = useState('')
  const [categoryValue, setCategoryValue] = useState('')
  const [isRecalculating, setIsRecalculating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

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
    if (!keywordValue.trim()) return

    const isAdded = await addKeyword(keywordValue, categoryValue)
    if (isAdded) {
      setKeywordValue('')
      // categoryValue is intentionally left as is for easier bulk entry
    }
  }

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
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

  const handleRecalculate = async () => {
    if (isRecalculating) return

    setIsRecalculating(true)
    const toastId = toast.loading('Пересчет совпадений...')

    try {
      const result = await keywordsApi.recalculateKeywordMatches()
      toast.success(
        `Обработано: ${result.processed}, обновлено: ${result.updated}, создано: ${result.created}, удалено: ${result.deleted}`,
        { id: toastId, duration: 5000 }
      )
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Ошибка при пересчете совпадений',
        { id: toastId }
      )
    } finally {
      setIsRecalculating(false)
    }
  }

  const filteredKeywords = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    if (!normalizedSearch) return keywords

    return keywords.filter(k => 
      k.word.toLowerCase().includes(normalizedSearch) || 
      (k.category && k.category.toLowerCase().includes(normalizedSearch))
    )
  }, [keywords, searchTerm])

  return (
    <div className="flex flex-col gap-8 pb-10 pt-6">
      {/* Header Section */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1.5">
          <PageTitle>Ключевые слова</PageTitle>
          <p className="max-w-2xl text-muted-foreground">
            Управляйте словарем для поиска совпадений в комментариях. Вы можете группировать слова по категориям.
          </p>
        </div>
      </div>

      {/* Actions Section */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end w-full lg:w-auto">
            <div className="w-full sm:w-[200px]">
                <Input 
                    placeholder="Категория (опц.)" 
                    value={categoryValue}
                    onChange={(e) => setCategoryValue(e.target.value)}
                />
            </div>
            <div className="flex w-full sm:w-auto gap-2 flex-1">
                <Input 
                    placeholder="Ключевое слово" 
                    value={keywordValue}
                    onChange={(e) => setKeywordValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                    className="flex-1 sm:w-[240px]"
                />
                <Button onClick={handleAddKeyword}>
                    <Plus className="mr-2 size-4" />
                    Добавить
                </Button>
            </div>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
             <Button
                variant="outline"
                onClick={handleRecalculate}
                disabled={isRecalculating}
                className="flex-1 lg:flex-none"
             >
                <RefreshCw className={`mr-2 size-4 ${isRecalculating ? 'animate-spin' : ''}`} />
                Пересчитать
             </Button>
             <FileUpload onUpload={handleFileUpload} buttonText="Импорт" className="flex-1 lg:flex-none" />
        </div>
      </div>

      <KeywordsTableCard 
        keywords={filteredKeywords}
        isLoading={isLoading}
        onDelete={deleteKeyword}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
    </div>
  )
}

export default Keywords
