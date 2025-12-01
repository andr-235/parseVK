import { Button } from '@/components/ui/button'
import { RefreshCw, Download, Upload } from 'lucide-react'
import PageTitle from '@/components/PageTitle'

interface ListingsHeroProps {
  isListLoading: boolean
  onImport: () => void
  onExport: () => void
  onRefresh: () => void
}

export const ListingsHero = ({ isListLoading, onImport, onExport, onRefresh }: ListingsHeroProps) => {
  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
      <div className="space-y-1.5">
        <PageTitle>Недвижимость</PageTitle>
        <p className="max-w-2xl text-text-secondary">
          База объявлений из различных источников. Импорт, просмотр и управление статусами.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={onImport} className="gap-2">
          <Upload className="h-4 w-4" />
          Импорт
        </Button>
        <Button variant="outline" onClick={onExport} className="gap-2">
          <Download className="h-4 w-4" />
          Экспорт
        </Button>
        <Button
          variant="secondary"
          onClick={onRefresh}
          disabled={isListLoading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isListLoading ? 'animate-spin' : ''}`} />
          Обновить
        </Button>
      </div>
    </div>
  )
}

