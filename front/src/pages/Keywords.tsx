import { useEffect, useState, type ChangeEvent } from 'react'
import { motion } from 'framer-motion'
import { useKeywordsStore } from '../stores'
import KeywordsHero from './Keywords/components/KeywordsHero'
import KeywordsActionsPanel from './Keywords/components/KeywordsActionsPanel'
import KeywordsCategoriesCard from './Keywords/components/KeywordsCategoriesCard'

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
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  }

  return (
    <motion.main
      variants={container}
      initial="hidden"
      animate="visible"
      className="relative flex flex-col gap-6 md:gap-7 [color-scheme:light] dark:[color-scheme:dark]"
    >
      {/* Декоративный фон с мягким градиентом, адаптируется к теме */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-10 -z-10 h-[220px] select-none bg-gradient-to-b from-accent/15 via-transparent to-transparent blur-[2px] dark:from-accent/20"
      />

      <motion.section variants={fadeUp}>
        <KeywordsHero />
      </motion.section>

      {/* Адаптивная двухколоночная сетка: действия слева (sticky), список категорий справа */}
      <section className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        <motion.aside
          variants={fadeUp}
          className="lg:col-span-4 lg:sticky lg:top-4 lg:self-start"
        >
          <KeywordsActionsPanel
            keywordValue={keywordValue}
            setKeywordValue={setKeywordValue}
            categoryValue={categoryValue}
            setCategoryValue={setCategoryValue}
            onAdd={handleAddKeyword}
            onUpload={handleFileUpload}
          />
        </motion.aside>

        <motion.div variants={fadeUp} className="lg:col-span-8">
          <KeywordsCategoriesCard keywords={keywords} isLoading={isLoading} onDelete={deleteKeyword} />
        </motion.div>
      </section>
    </motion.main>
  )
}

export default Keywords
