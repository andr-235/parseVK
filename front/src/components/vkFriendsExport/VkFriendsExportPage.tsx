import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { useVkFriendsExport } from '@/hooks/vkFriendsExport/useVkFriendsExport'
import { PageHeader } from '@/components/common'
import { Download, Users, FileSpreadsheet, Activity } from 'lucide-react'
import { ExportProgressSection } from '@/components/common/ExportProgressSection'

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
    <div className="flex flex-col gap-10 max-w-[1600px] mx-auto w-full px-4 md:px-8 py-6 font-monitoring-body">
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
        <PageHeader
          variant="grid"
          title={
            <>
              Экспорт друзей <span className="text-accent-primary">ВКонтакте</span>
            </>
          }
          description="Формируйте XLSX отчёт по методу friends.get с отслеживанием прогресса и детальными логами выполнения. Экспорт всех данных профилей друзей пользователя."
          cards={[
            {
              icon: Download,
              title: 'Экспорт',
              subtitle: 'Загрузка XLSX файла',
            },
            {
              icon: Users,
              title: 'Friends API',
              subtitle: 'Метод friends.get',
              bgGradientClass: 'from-accent-primary/20 to-accent-info/20',
              borderGradientClass: 'via-accent-primary/50',
              iconBgClass: 'bg-accent-primary/10',
              iconTextClass: 'text-accent-primary',
            },
            {
              icon: FileSpreadsheet,
              title: 'Формат',
              subtitle: 'Excel таблица',
              bgGradientClass: 'from-accent-info/20 to-accent-primary/20',
              borderGradientClass: 'via-accent-info/50',
              iconBgClass: 'bg-accent-info/10',
              iconTextClass: 'text-accent-info',
            },
            {
              icon: Activity,
              title: 'Прогресс',
              subtitle: 'Отслеживание и логи',
              bgGradientClass: 'from-accent-primary/20 to-accent-info/20',
              borderGradientClass: 'via-accent-primary/50',
              iconBgClass: 'bg-accent-primary/10',
              iconTextClass: 'text-accent-primary',
            },
          ]}
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
              Введите user_id. count и fields задаются автоматически как «все».
            </p>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="vk-user-id"
                  className="text-xs font-medium uppercase tracking-wider text-slate-400"
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

export default VkFriendsExportPage
