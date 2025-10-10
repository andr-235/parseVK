import { useEffect, useState, type ChangeEvent } from 'react'
import { useKeywordsStore } from '../stores'
import { getKeywordTableColumns } from '../config/keywordTableColumns'
import KeywordsHero from './Keywords/components/KeywordsHero'
import KeywordsActionsPanel from './Keywords/components/KeywordsActionsPanel'
import KeywordsTableCard from './Keywords/components/KeywordsTableCard'
import { Separator } from '@/components/ui/separator'

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

  const keywordCount = keywords.length

  return (
    <div className="flex flex-col gap-8">
      <KeywordsHero keywordCount={keywordCount} />

      <Separator className="opacity-40" />

      <KeywordsActionsPanel
        keywordValue={keywordValue}
        setKeywordValue={setKeywordValue}
        onAdd={handleAddKeyword}
        onUpload={handleFileUpload}
      />

      <KeywordsTableCard
        keywords={keywords}
        isLoading={isLoading}
        onDelete={deleteKeyword}
        columns={getKeywordTableColumns}
      />
    </div>
  )
}

export default Keywords

