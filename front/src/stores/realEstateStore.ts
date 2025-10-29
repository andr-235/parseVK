import { create } from 'zustand'

import { queryClient } from '@/lib/queryClient'
import { queryKeys } from '@/queries/queryKeys'
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
  setFilters: (partial: Partial<RealEstateFilters>, options?: { refetch?: boolean }) => void
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

  setFilters: (partial, options) => {
    set((state) => ({
      filters: {
        ...state.filters,
        ...partial,
      },
    }))

    if (options?.refetch !== false) {
      const filters = get().filters
      void queryClient.invalidateQueries({ queryKey: queryKeys.realEstate(filters), refetchType: 'active' })
    }
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

    const filters = get().filters
    void queryClient.invalidateQueries({ queryKey: queryKeys.realEstate(filters), refetchType: 'active' })
  },

  fetchListings: async () => {
    const { filters } = get()

    set({ isLoading: true })

    try {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.realEstate(filters),
        refetchType: 'active',
      })
    } catch (error) {
      set({
        listings: [],
        summary: null,
      })
      throw error
    } finally {
      set({ isLoading: queryClient.isFetching({ queryKey: queryKeys.realEstate(get().filters) }) > 0 })
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
