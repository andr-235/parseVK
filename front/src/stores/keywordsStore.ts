import { create } from 'zustand'
import { keywordsApi } from '../api/keywordsApi'
import { queryClient } from '@/lib/queryClient'
import { queryKeys } from '@/queries/queryKeys'
import type { KeywordsState } from '../types/stores'

export const useKeywordsStore = create<KeywordsState>((set) => ({
  keywords: [],
  isLoading: false,

  async fetchKeywords() {
    set({ isLoading: true })
    try {
      await queryClient.invalidateQueries({ queryKey: queryKeys.keywords, refetchType: 'active' })
    } catch (error) {
      console.error('Failed to fetch keywords', error)
      throw error
    } finally {
      set({ isLoading: queryClient.isFetching({ queryKey: queryKeys.keywords }) > 0 })
    }
  },

  async addKeyword(word, category) {
    const trimmed = word.trim()
    const trimmedCategory = category?.trim() ?? ''
    if (!trimmed) {
      return false
    }

    try {
      const keyword = await keywordsApi.addKeyword(trimmed, trimmedCategory ? trimmedCategory : null)
      set((state) => {
        const existingIndex = state.keywords.findIndex(
          (existing) => existing.id === keyword.id || existing.word === keyword.word
        )

        if (existingIndex >= 0) {
          const nextKeywords = [...state.keywords]
          nextKeywords[existingIndex] = keyword
          return { keywords: nextKeywords }
        }

        return { keywords: [...state.keywords, keyword] }
      })
      void queryClient.invalidateQueries({ queryKey: queryKeys.keywords, refetchType: 'active' })
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
      void queryClient.invalidateQueries({ queryKey: queryKeys.keywords, refetchType: 'active' })
    } catch (error) {
      console.error('Failed to delete keyword', error)
      throw error
    }
  },

  async loadFromFile(file) {
    try {
      const response = await keywordsApi.uploadKeywords(file)
      await queryClient.invalidateQueries({ queryKey: queryKeys.keywords, refetchType: 'active' })
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
      void queryClient.invalidateQueries({ queryKey: queryKeys.keywords, refetchType: 'active' })
    } catch (error) {
      console.error('Failed to delete all keywords', error)
      throw error
    }
  }
}))
