import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Play } from 'lucide-react'
import { useAutomationSettings } from '../hooks/useAutomationSettings'

export const SettingsHero = () => {
  const { settings, isTriggering, handleRunNow } = useAutomationSettings()

  return (
    <div className="flex flex-col items-end gap-2">
      <Badge
        variant={settings?.enabled ? 'secondary' : 'outline'}
        className={
          settings?.enabled
            ? 'border-green-500/20 bg-green-500/10 text-green-500'
            : 'bg-muted text-muted-foreground'
        }
      >
        {settings?.enabled ? 'Автозапуск активен' : 'Автозапуск выключен'}
      </Badge>
      <Button
        variant="default"
        size="sm"
        onClick={handleRunNow}
        disabled={!settings || isTriggering || settings?.isRunning}
        className="bg-accent-primary hover:bg-accent-primary/90"
      >
        <Play className="mr-2 h-4 w-4" />
        {isTriggering || settings?.isRunning ? 'Запуск...' : 'Запустить сейчас'}
      </Button>
    </div>
  )
}

