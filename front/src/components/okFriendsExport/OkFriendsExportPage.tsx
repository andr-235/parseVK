import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { useOkFriendsExport } from '@/hooks/okFriendsExport/useOkFriendsExport'
import { PageHeader } from '@/components/common'
import { Download, Users, FileSpreadsheet, Activity } from 'lucide-react'
import { ExportProgressSection } from '@/components/common/ExportProgressSection'

const PAGE_CARDS = [
  { icon: Download, title: 'Экспорт', subtitle: 'Загрузка XLSX файла' },
  { icon: Users, title: 'OK API', subtitle: 'Метод friends.get' },
  { icon: FileSpreadsheet, title: 'Формат', subtitle: 'Excel таблица' },
  { icon: Activity, title: 'Прогресс', subtitle: 'Отслеживание и логи' },
]

function OkFriendsExportPage() {
  const {
    formState,
    updateField,
    jobWarning,
    jobError,
    jobLogs,
    jobProgress,
    progressLabel,
    isProgressIndeterminate,
    isExportLoading,
    handleGenerateXlsx,
  } = useOkFriendsExport()

  return (
    <div className="flex flex-col gap-10 max-w-[1600px] mx-auto w-full px-4 md:px-8 py-6 font-monitoring-body">
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
        <PageHeader
          variant="grid"
          title={
            <>
              Экспорт друзей <span className="text-accent-info">Одноклассников</span>
            </>
          }
          description="Формируйте XLSX отчёт по методу friends.get с настраиваемыми параметрами offset и limit. Отслеживайте прогресс выполнения и детальные логи операций."
          cards={PAGE_CARDS}
        />
      </div>

      {/* Main Content */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)] animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-100">
        {/* Parameters Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <h2 className="font-monitoring-display text-2xl font-semibold text-text-light">
              Параметры friends.get
            </h2>
            <div className="h-px flex-1 bg-border/40" />
          </div>

          <Card className="border border-border bg-background-secondary rounded-card p-6 overflow-hidden relative">
            <p className="text-sm text-text-secondary mb-6">
              Введите fid (ID пользователя), offset и limit (максимум 5000).
            </p>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="ok-fid"
                  className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-monitoring-body"
                >
                  fid (ID пользователя)
                </Label>
                <Input
                  id="ok-fid"
                  type="text"
                  value={formState.fid}
                  onChange={(event) => updateField('fid', event.target.value)}
                  placeholder="580781939408"
                  className="h-10 border-border bg-background-primary text-text-light placeholder:text-text-secondary focus:border-accent-primary/50 focus:ring-accent-primary/20 transition-all duration-200"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="ok-offset"
                  className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-monitoring-body"
                >
                  offset
                </Label>
                <Input
                  id="ok-offset"
                  type="number"
                  value={formState.offset}
                  onChange={(event) => updateField('offset', event.target.value)}
                  placeholder="0"
                  min={0}
                  className="h-10 border-border bg-background-primary text-text-light placeholder:text-text-secondary focus:border-accent-primary/50 focus:ring-accent-primary/20 transition-all duration-200"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="ok-limit"
                  className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-monitoring-body"
                >
                  limit (макс 5000)
                </Label>
                <Input
                  id="ok-limit"
                  type="number"
                  value={formState.limit}
                  onChange={(event) => updateField('limit', event.target.value)}
                  placeholder="5000"
                  min={1}
                  max={5000}
                  className="h-10 border-border bg-background-primary text-text-light placeholder:text-text-secondary focus:border-accent-primary/50 focus:ring-accent-primary/20 transition-all duration-200"
                />
              </div>
              <Button
                onClick={handleGenerateXlsx}
                disabled={isExportLoading}
                variant="primary"
                className="w-full h-10 shadow-soft-sm font-semibold hover:shadow-soft-md transition-all duration-200 cursor-pointer"
              >
                {isExportLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner className="size-4 animate-spin" />
                    Формируем XLSX...
                  </span>
                ) : (
                  'Загрузить XLSX'
                )}
              </Button>
            </div>
          </Card>
        </div>

        {/* Progress Section */}
        <ExportProgressSection
          jobProgress={jobProgress}
          progressLabel={progressLabel}
          isProgressIndeterminate={isProgressIndeterminate}
          jobWarning={jobWarning}
          jobError={jobError}
          jobLogs={jobLogs}
        />
      </div>
    </div>
  )
}

export default OkFriendsExportPage
