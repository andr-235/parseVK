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
            <h2 className="font-monitoring-display text-2xl font-semibold text-white">
              Параметры friends.get
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          </div>

          <Card className="border border-white/10 bg-[#131316]/90 backdrop-blur-2xl p-6 overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <p className="text-sm text-slate-400 mb-6">
              Введите fid (ID пользователя), offset и limit (максимум 5000).
            </p>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="ok-fid"
                  className="text-xs font-medium uppercase tracking-wider text-slate-400"
                >
                  fid (ID пользователя)
                </Label>
                <Input
                  id="ok-fid"
                  type="text"
                  value={formState.fid}
                  onChange={(event) => updateField('fid', event.target.value)}
                  placeholder="580781939408"
                  className="h-11 border-[#2a2a30] bg-[#1c1c21] text-white placeholder:text-slate-500 focus:border-primary/50 focus:ring-primary/20 transition-all duration-200"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="ok-offset"
                  className="text-xs font-medium uppercase tracking-wider text-slate-400"
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
                  className="h-11 border-[#2a2a30] bg-[#1c1c21] text-white placeholder:text-slate-500 focus:border-primary/50 focus:ring-primary/20 transition-all duration-200"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="ok-limit"
                  className="text-xs font-medium uppercase tracking-wider text-slate-400"
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
                  className="h-11 border-[#2a2a30] bg-[#1c1c21] text-white placeholder:text-slate-500 focus:border-primary/50 focus:ring-primary/20 transition-all duration-200"
                />
              </div>
              <Button
                onClick={handleGenerateXlsx}
                disabled={isExportLoading}
                className="w-full h-11 bg-gradient-to-r from-primary to-orange-500 text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300"
              >
                {isExportLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner className="size-4" />
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
