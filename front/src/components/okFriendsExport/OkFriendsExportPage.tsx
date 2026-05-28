import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useOkFriendsExport } from '@/hooks/okFriendsExport/useOkFriendsExport'
import { ExportPageTemplate } from '@/components/common/ExportPageTemplate'

export const OkFriendsExportPage = () => {
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

  const presets = [
    { label: 'Тест профиль (580781939408)', onClick: () => updateField('fid', '580781939408') },
    { label: 'Лимит: 500', onClick: () => updateField('limit', '500') },
    { label: 'Лимит: 1000', onClick: () => updateField('limit', '1000') },
    { label: 'Лимит: 5000 (Макс)', onClick: () => updateField('limit', '5000') },
  ]

  return (
    <ExportPageTemplate
      title={
        <>
          Консоль экспорта друзей <span className="text-accent-info">Одноклассников</span>
        </>
      }
      description="Формируйте XLSX отчёт по методу friends.get с настраиваемыми параметрами offset и limit. Отслеживайте прогресс выполнения и детальные логи операций."
      platformLabel="Одноклассники"
      platformColorClass="text-accent-info"
      apiMethod="friends.get"
      isExportLoading={isExportLoading}
      handleGenerateXlsx={handleGenerateXlsx}
      jobProgress={jobProgress}
      progressLabel={progressLabel}
      isProgressIndeterminate={isProgressIndeterminate}
      jobWarning={jobWarning}
      jobError={jobError}
      jobLogs={jobLogs}
      presets={presets}
    >
      <div className="space-y-4 animate-in fade-in duration-300">
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
            className="h-10 border-border bg-background-primary text-text-light placeholder:text-text-secondary focus:border-accent-primary/50 focus:ring-accent-primary/20 transition-all duration-200 font-mono-accent"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
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
              className="h-10 border-border bg-background-primary text-text-light placeholder:text-text-secondary focus:border-accent-primary/50 focus:ring-accent-primary/20 transition-all duration-200 font-mono-accent"
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
              className="h-10 border-border bg-background-primary text-text-light placeholder:text-text-secondary focus:border-accent-primary/50 focus:ring-accent-primary/20 transition-all duration-200 font-mono-accent"
            />
          </div>
        </div>
      </div>
    </ExportPageTemplate>
  )
}

export default OkFriendsExportPage
