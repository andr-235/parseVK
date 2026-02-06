import CircularProgress from '@/shared/components/CircularProgress'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Spinner } from '@/shared/ui/spinner'
import { useOkFriendsExport } from '@/modules/okFriendsExport/hooks/useOkFriendsExport'
import { OkFriendsExportHero } from '@/modules/okFriendsExport/components/OkFriendsExportHero'
import {
  formatCellValue,
  formatLogTime,
  LOG_LEVEL_CLASSES,
  LOG_LEVEL_LABELS,
  truncateValue,
} from '@/modules/okFriendsExport/utils/okFriendsExportUtils'

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
      {/* Hero Section */}
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
        <OkFriendsExportHero />
      </div>

      {/* Main Content */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)] animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-100">
        {/* Parameters Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <h2 className="font-monitoring-display text-2xl font-semibold text-white">
              Параметры friends.get
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
          </div>

          <Card className="border border-white/10 bg-slate-900/80 backdrop-blur-2xl p-6 overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
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
                  className="h-11 border-white/10 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-cyan-400/20 transition-all duration-200"
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
                  className="h-11 border-white/10 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-cyan-400/20 transition-all duration-200"
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
                  className="h-11 border-white/10 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-cyan-400/20 transition-all duration-200"
                />
              </div>
              <Button
                onClick={handleGenerateXlsx}
                disabled={isExportLoading}
                className="w-full h-11 bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/40 transition-all duration-300"
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
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <h2 className="font-monitoring-display text-2xl font-semibold text-white">
              Прогресс и логи
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
          </div>

          <Card className="border border-white/10 bg-slate-900/80 backdrop-blur-2xl p-6 overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
            <p className="text-sm text-slate-400 mb-6">Состояние текущего экспорта и события.</p>
            <div className="space-y-5">
              <div className="space-y-3">
                <span className="text-sm text-slate-400">Статус:</span>
                <CircularProgress
                  current={jobProgress.fetchedCount}
                  total={jobProgress.totalCount}
                  label={progressLabel}
                  indeterminate={isProgressIndeterminate}
                />
              </div>

              {jobWarning && (
                <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
                  <span className="font-medium">Внимание:</span> {jobWarning}
                </div>
              )}
              {jobError && (
                <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {jobError}
                </div>
              )}

              <div className="space-y-3">
                <div className="text-sm font-medium text-slate-400">Последние логи</div>
                {jobLogs.length === 0 ? (
                  <div className="max-h-72 overflow-auto rounded-lg border border-white/10 bg-slate-800/30 px-4 py-6 text-center text-sm text-slate-400">
                    Логи появятся после запуска экспорта.
                  </div>
                ) : (
                  <div className="max-h-72 space-y-2 overflow-auto rounded-lg border border-white/10 bg-slate-800/30 p-4">
                    {jobLogs.map((log) => (
                      <div key={log.id} className="space-y-0.5">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm">
                          <span
                            className={`shrink-0 font-semibold ${LOG_LEVEL_CLASSES[log.level]}`}
                          >
                            {LOG_LEVEL_LABELS[log.level]}
                          </span>
                          <span className="text-white">{log.message}</span>
                          {log.createdAt && (
                            <span className="text-xs text-slate-500">
                              {formatLogTime(log.createdAt)}
                            </span>
                          )}
                        </div>
                        {log.meta !== undefined && (
                          <div className="text-xs text-slate-500">
                            {truncateValue(formatCellValue(log.meta), 140)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default OkFriendsExportPage
