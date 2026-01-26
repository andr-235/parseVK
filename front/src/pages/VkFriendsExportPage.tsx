import PageHeroCard from '@/components/PageHeroCard'
import CircularProgress from '@/components/CircularProgress'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { useVkFriendsExport } from '@/modules/vkFriendsExport/hooks/useVkFriendsExport'
import {
  formatCellValue,
  formatLogTime,
  LOG_LEVEL_CLASSES,
  LOG_LEVEL_LABELS,
  truncateValue,
} from '@/modules/vkFriendsExport/utils/vkFriendsExportUtils'

const PANEL_CLASS =
  'overflow-hidden rounded-2xl border border-border/60 bg-background/70 shadow-soft-sm backdrop-blur'

function VkFriendsExportPage() {
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
  } = useVkFriendsExport()

  return (
    <div className="flex flex-col gap-6 pb-8">
      <PageHeroCard
        title="Экспорт друзей ВКонтакте"
        description="Формируйте XLSX отчёт по friends.get с прогрессом и логами."
        className={PANEL_CLASS}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)]">
        <Card className={PANEL_CLASS}>
          <CardHeader className="gap-1 border-b border-border/50 pb-5">
            <CardTitle className="text-xl text-text-primary">Параметры friends.get</CardTitle>
            <CardDescription>
              Введите user_id. count и fields задаются автоматически как «все».
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-5">
            <div className="space-y-2">
              <Label htmlFor="vk-user-id">user_id</Label>
              <Input
                id="vk-user-id"
                type="number"
                value={formState.userId}
                onChange={(event) => updateField('userId', event.target.value)}
                placeholder="123456"
                min={0}
                className="rounded-xl border-border/60 bg-background/70 backdrop-blur"
              />
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <Button onClick={handleGenerateXlsx} disabled={isExportLoading}>
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
          </CardContent>
        </Card>

        <Card className={PANEL_CLASS}>
          <CardHeader className="gap-1 border-b border-border/50 pb-5">
            <CardTitle className="text-xl text-text-primary">Прогресс и логи</CardTitle>
            <CardDescription>Состояние текущего экспорта и события.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-5">
            <div className="space-y-3">
              <span className="text-sm text-text-secondary">Статус:</span>
              <CircularProgress
                current={jobProgress.fetchedCount}
                total={jobProgress.totalCount}
                label={progressLabel}
                indeterminate={isProgressIndeterminate}
              />
            </div>

            {jobWarning && (
              <div className="rounded-lg border border-border/60 bg-background-secondary/80 px-3 py-2 text-sm text-text-secondary">
                <span className="font-medium text-accent-warning">Внимание:</span> {jobWarning}
              </div>
            )}
            {jobError && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {jobError}
              </div>
            )}

            <div className="space-y-2">
              <div className="text-sm font-medium text-text-secondary">Последние логи</div>
              {jobLogs.length === 0 ? (
                <div className="max-h-72 overflow-auto rounded-lg border border-border/50 bg-background-secondary/70 px-4 py-6 text-center text-sm text-text-secondary">
                  Логи появятся после запуска экспорта.
                </div>
              ) : (
                <div className="max-h-72 space-y-2 overflow-auto rounded-lg border border-border/60 bg-background-secondary/70 p-4">
                  {jobLogs.map((log) => (
                    <div key={log.id} className="space-y-0.5">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm">
                        <span className={`shrink-0 font-semibold ${LOG_LEVEL_CLASSES[log.level]}`}>
                          {LOG_LEVEL_LABELS[log.level]}
                        </span>
                        <span className="text-text-primary">{log.message}</span>
                        {log.createdAt && (
                          <span className="text-xs text-text-tertiary">
                            {formatLogTime(log.createdAt)}
                          </span>
                        )}
                      </div>
                      {log.meta !== undefined && (
                        <div className="text-xs text-text-tertiary">
                          {truncateValue(formatCellValue(log.meta), 140)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default VkFriendsExportPage
