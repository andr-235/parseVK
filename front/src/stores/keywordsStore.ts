import { create } from 'zustand'
import { keywordsApi } from '../api/keywordsApi'
import type { KeywordsState } from '../types/stores'

export const useKeywordsStore = create<KeywordsState>((set, get) => ({
  keywords: [],
  isLoading: false,

  async fetchKeywords() {
    set({ isLoading: true })
    try {
      const keywords = await keywordsApi.getAllKeywords()
      set({ keywords, isLoading: false })
    } catch (error) {
      console.error('Failed to fetch keywords', error)
      set({ isLoading: false })
      throw error
    }
  },

  async addKeyword(word) {
    const trimmed = word.trim()
    if (!trimmed) {
      return false
    }

    try {
      const keyword = await keywordsApi.addKeyword(trimmed)
      set((state) => ({ keywords: [...state.keywords, keyword] }))
      return true
    } catch (error) {
      console.error('Failed to add keyword', error)
      return false
    }
  },

  async deleteKeyword(id) {
    try {
      await keywordsApi.deleteKeyword(id)
      set((state) => ({ keywords: state.keywords.filter((kw) => kw.id !== id) }))
    } catch (error) {
      console.error('Failed to delete keyword', error)
      throw error
    }
  },

  async loadFromFile(file) {
    try {
      const response = await keywordsApi.uploadKeywords(file)
      await get().fetchKeywords()
      return response
    } catch (error) {
      console.error('Failed to load keywords from file', error)
      throw error
    }
  },

  async deleteAllKeywords() {
    try {
      await keywordsApi.deleteAllKeywords()
      set({ keywords: [] })
    } catch (error) {
      console.error('Failed to delete all keywords', error)
      throw error
    }
  }
}))


