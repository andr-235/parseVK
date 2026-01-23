import PageHeroCard from '@/components/PageHeroCard'
import SectionCard from '@/components/SectionCard'
import ProgressBar from '@/components/ProgressBar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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

function VkFriendsExportPage() {
  const {
    formState,
    updateField,
    jobWarning,
    jobError,
    jobLogs,
    jobProgress,
    jobStatusLabel,
    jobStatusVariant,
    progressLabel,
    isProgressIndeterminate,
    isExportLoading,
    handleGenerateDocx,
  } = useVkFriendsExport()

  return (
    <div className="flex flex-col gap-6 pb-8">
      <PageHeroCard
        title="Экспорт друзей ВКонтакте"
        description="Формируйте DOCX отчёт по friends.get с прогрессом и логами."
        actions={
          <div className="flex flex-col gap-2 text-sm text-text-secondary">
            <span>Нажмите кнопку, чтобы собрать данные и скачать DOCX.</span>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)]">
        <SectionCard
          title="Параметры friends.get"
          description="Введите user_id. count и fields задаются автоматически как “все”."
        >
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="vk-user-id">user_id</Label>
              <Input
                id="vk-user-id"
                type="number"
                value={formState.userId}
                onChange={(event) => updateField('userId', event.target.value)}
                placeholder="123456"
                min={0}
              />
            </div>

            <div className="grid gap-3">
              <label
                htmlFor="vk-include-raw"
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/50 bg-background-secondary/70 px-3 py-2 text-sm"
              >
                <input
                  id="vk-include-raw"
                  type="checkbox"
                  checked={formState.includeRawJson}
                  onChange={(event) => updateField('includeRawJson', event.target.checked)}
                  className="h-5 w-5 rounded border-border bg-background text-accent-primary focus:ring-accent-primary focus:ring-offset-0"
                />
                includeRawJson
              </label>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <Button onClick={handleGenerateDocx} disabled={isExportLoading}>
                {isExportLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner className="size-4" />
                    Формируем DOCX...
                  </span>
                ) : (
                  'Загрузить DOCX'
                )}
              </Button>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Прогресс и логи" description="Состояние текущего экспорта и события.">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-secondary">Статус:</span>
                <Badge variant={jobStatusVariant}>{jobStatusLabel}</Badge>
              </div>
            </div>

            <ProgressBar
              current={jobProgress.fetchedCount}
              total={jobProgress.totalCount}
              label={progressLabel}
              indeterminate={isProgressIndeterminate}
            />

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
                <div className="rounded-lg border border-border/50 bg-background-secondary/70 px-4 py-6 text-center text-sm text-text-secondary">
                  Логи появятся после запуска экспорта.
                </div>
              ) : (
                <div className="max-h-72 space-y-3 overflow-auto rounded-lg border border-border/60 bg-background-secondary/70 p-4">
                  {jobLogs.map((log) => (
                    <div key={log.id} className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold ${LOG_LEVEL_CLASSES[log.level]}`}>
                            {LOG_LEVEL_LABELS[log.level]}
                          </span>
                          <span className="text-sm text-text-primary">{log.message}</span>
                        </div>
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
          </div>
        </SectionCard>
      </div>
    </div>
  )
}

export default VkFriendsExportPage
