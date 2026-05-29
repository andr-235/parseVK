import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { useVkFriendsExport } from '@/pages/vk-friends-export/hooks/useVkFriendsExport'
import { ExportPageTemplate } from '@/shared/components/common/ExportPageTemplate'

export const VkFriendsExportPage = () => {
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

  const presets = [
    { label: 'Мой ID (1)', onClick: () => updateField('userId', '1') },
    { label: 'Тестовый профиль (324)', onClick: () => updateField('userId', '324') },
  ]

  return (
    <ExportPageTemplate
      title={
        <>
          Консоль экспорта друзей <span className="text-accent-primary">ВКонтакте</span>
        </>
      }
      description="Формируйте XLSX отчёт по методу friends.get с отслеживанием прогресса и детальными логами выполнения. Экспорт всех данных профилей друзей пользователя."
      platformLabel="ВКонтакте"
      platformColorClass="text-accent-primary"
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
      <div className="space-y-2 animate-in fade-in duration-300">
        <Label
          htmlFor="vk-user-id"
          className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-monitoring-body"
        >
          user_id
        </Label>
        <Input
          id="vk-user-id"
          type="number"
          value={formState.userId}
          onChange={(event) => updateField('userId', event.target.value)}
          placeholder="123456"
          min={0}
          className="h-10 border-border bg-background-primary text-text-light placeholder:text-text-secondary focus:border-accent-primary/50 focus:ring-accent-primary/20 transition-all duration-200 font-mono-accent"
        />
        <p className="text-[11px] text-text-secondary font-monitoring-body">
          Укажите числовой идентификатор пользователя ВКонтакте для сбора его списка друзей.
        </p>
      </div>
    </ExportPageTemplate>
  )
}

export default VkFriendsExportPage
