import toast from 'react-hot-toast'

import { realEstateListingsApi } from '@/api/realEstateListingsApi'
import type {
  RealEstateFilters,
  RealEstateListingsResponse,
  RealEstateReportFormat,
} from '@/types/realEstate'
import { saveReportBlob } from '@/utils/reportExport'

export const realEstateService = {
  async fetchListings(filters: RealEstateFilters): Promise<RealEstateListingsResponse> {
    try {
      return await realEstateListingsApi.fetchListings(filters)
    } catch (error) {
      toast.error('Не удалось загрузить объявления')
      throw error
    }
  },

  async downloadReport(
    filters: RealEstateFilters,
    options?: { format?: RealEstateReportFormat; filename?: string },
  ): Promise<void> {
    const format = options?.format ?? 'xlsx'

    try {
      const blob = await realEstateListingsApi.exportReport(filters, format)
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filename = options?.filename ?? `real-estate-report-${timestamp}.${format}`

      saveReportBlob(blob, filename)
      toast.success('Отчёт сохранён')
    } catch (error) {
      toast.error('Не удалось сохранить отчёт')
      throw error
    }
  },
}
