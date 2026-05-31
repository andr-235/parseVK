import { Fragment } from 'react'
import { Calendar, Clock } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { cn } from '@/shared/utils'
import {
  formatTaskAutomationDate,
  TASK_AUTOMATION_EMPTY_DATE,
} from '@/pages/tasks/utils/taskAutomationDates'

interface TaskAutomationStripProps {
  settings?: {
    enabled?: boolean
    nextRunAt?: string | null
    lastRunAt?: string | null
  } | null
  onOpenSettings: () => void
}

function TaskAutomationStrip({ settings, onOpenSettings }: TaskAutomationStripProps) {
  const automationEnabled = settings?.enabled ?? false
  const nextRunText = automationEnabled
    ? formatTaskAutomationDate(settings?.nextRunAt ?? null)
    : TASK_AUTOMATION_EMPTY_DATE
  const lastRunText = formatTaskAutomationDate(settings?.lastRunAt ?? null)

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 px-4 md:px-8 pb-3">
      <Badge
        variant="outline"
        className={cn(
          'text-xs tracking-wider font-semibold rounded-full font-mono-accent uppercase',
          automationEnabled
            ? 'border border-accent-success/20 bg-accent-success/10 text-accent-success'
            : 'border border-border/60 bg-background-primary/50 text-text-secondary'
        )}
      >
        {automationEnabled
          ? 'РђРІС‚РѕРјР°С‚РёР·Р°С†РёСЏ РІРєР»СЋС‡РµРЅР°'
          : 'РђРІС‚РѕРјР°С‚РёР·Р°С†РёСЏ РІС‹РєР»СЋС‡РµРЅР°'}
      </Badge>

      {[
        { icon: Clock, label: 'РЎР»РµРґСѓСЋС‰РёР№ Р·Р°РїСѓСЃРє:', value: nextRunText },
        { icon: Calendar, label: 'РџРѕСЃР»РµРґРЅРёР№ Р·Р°РїСѓСЃРє:', value: lastRunText },
      ].map((item, i) => (
        <Fragment key={item.label}>
          {i > 0 && <div className="w-px h-3 bg-border/40" />}
          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            <item.icon className="w-3 h-3" />
            <span className="text-text-secondary/70">{item.label}</span>
            <span className="font-mono-accent text-xs font-medium text-text-primary">
              {item.value}
            </span>
          </div>
        </Fragment>
      ))}

      <button
        type="button"
        onClick={onOpenSettings}
        className="text-xs font-semibold text-accent-primary hover:text-accent-primary/80 transition-colors"
      >
        РќР°СЃС‚СЂРѕРёС‚СЊ
      </button>
    </div>
  )
}

export default TaskAutomationStrip
