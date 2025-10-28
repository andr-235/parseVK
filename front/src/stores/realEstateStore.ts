import { create } from 'zustand'

import { realEstateService } from '@/services/realEstateService'
import type {
  RealEstateFilters,
  RealEstateListing,
  RealEstateListingSource,
  RealEstateReportFormat,
  RealEstateSummary,
} from '@/types/realEstate'

interface RealEstateState {
  listings: RealEstateListing[]
  summary: RealEstateSummary | null
  filters: RealEstateFilters
  isLoading: boolean
  isExporting: boolean
  lastGeneratedAt: string | null
  setFilters: (partial: Partial<RealEstateFilters>) => void
  toggleSource: (source: RealEstateListingSource) => void
  fetchListings: () => Promise<void>
  downloadReport: (options?: { format?: RealEstateReportFormat }) => Promise<void>
}

const defaultFilters: RealEstateFilters = {
  period: '24h',
  sources: ['AVITO', 'YOULA'],
  onlyNew: false,
}

export const useRealEstateStore = create<RealEstateState>((set, get) => ({
  listings: [],
  summary: null,
  filters: defaultFilters,
  isLoading: false,
  isExporting: false,
  lastGeneratedAt: null,

  setFilters: (partial) => {
    set((state) => ({
      filters: {
        ...state.filters,
        ...partial,
      },
    }))
  },

  toggleSource: (source) => {
    set((state) => {
      const exists = state.filters.sources.includes(source)
      const nextSources = exists
        ? state.filters.sources.filter((item) => item !== source)
        : [...state.filters.sources, source]

      return {
        filters: {
          ...state.filters,
          sources: nextSources.length > 0 ? nextSources : [source],
        },
      }
    })
  },

  fetchListings: async () => {
    const { filters } = get()

    set({ isLoading: true })

    try {
      const response = await realEstateService.fetchListings(filters)

      set({
        listings: response.items,
        summary: response.summary ?? null,
        lastGeneratedAt: response.generatedAt ?? null,
      })
    } catch (error) {
      set({
        listings: [],
        summary: null,
      })
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  downloadReport: async (options) => {
    const { filters } = get()

    set({ isExporting: true })

    try {
      await realEstateService.downloadReport(filters, {
        format: options?.format,
      })
      return
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[realEstateStore] downloadReport error', error)
      }

      return
    } finally {
      set({ isExporting: false })
    }
  },
}))
