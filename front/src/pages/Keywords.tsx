import { useEffect, useState, type ChangeEvent } from 'react'
import { motion } from 'framer-motion'
import { useKeywordsStore } from '../stores'
import KeywordsHero from './Keywords/components/KeywordsHero'
import KeywordsActionsPanel from './Keywords/components/KeywordsActionsPanel'
import KeywordsCategoriesCard from './Keywords/components/KeywordsCategoriesCard'
// Separator удалён для уменьшения визуальной тяжести

function Keywords() {
  const keywords = useKeywordsStore((state) => state.keywords)
  const addKeyword = useKeywordsStore((state) => state.addKeyword)
  const deleteKeyword = useKeywordsStore((state) => state.deleteKeyword)
  const loadFromFile = useKeywordsStore((state) => state.loadFromFile)
  const fetchKeywords = useKeywordsStore((state) => state.fetchKeywords)
  const isLoading = useKeywordsStore((state) => state.isLoading)
  const [keywordValue, setKeywordValue] = useState('')
  const [categoryValue, setCategoryValue] = useState('')

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
    const isAdded = await addKeyword(keywordValue, categoryValue)
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

  const container = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } },
  }

  const fadeUp = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  }

  return (
    <motion.div className="flex flex-col gap-5" variants={container} initial="hidden" animate="visible">
      <motion.div variants={fadeUp}>
        <KeywordsHero />
      </motion.div>

      <motion.div variants={fadeUp}>
        <KeywordsActionsPanel
          keywordValue={keywordValue}
          setKeywordValue={setKeywordValue}
          categoryValue={categoryValue}
          setCategoryValue={setCategoryValue}
          onAdd={handleAddKeyword}
          onUpload={handleFileUpload}
        />
      </motion.div>

      <motion.div variants={fadeUp}>
        <KeywordsCategoriesCard keywords={keywords} isLoading={isLoading} onDelete={deleteKeyword} />
      </motion.div>
    </motion.div>
  )
}

export default Keywords
