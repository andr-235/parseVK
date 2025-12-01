import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Smartphone, Key, Hash, Info, Save, Send } from 'lucide-react'
import { useTelegramSettings } from '@/modules/settings/hooks/useTelegramSettings'

export const TelegramCard = () => {
  const {
    formState,
    isLoading,
    isSaving,
    handlePhoneChange,
    handleApiIdChange,
    handleApiHashChange,
    handleSubmit,
  } = useTelegramSettings()

  const isDisabled = isLoading || isSaving

  return (
    <Card className="flex h-full flex-col border-border/50 bg-background-secondary/40 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-blue-500/10 p-2 text-blue-500">
            <Send className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">Telegram API</CardTitle>
            <CardDescription>Настройки подключения</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-6">
        <div className="flex items-start gap-3 rounded-md bg-blue-500/10 p-4 text-sm text-blue-600 dark:text-blue-400">
          <Info className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="space-y-1">
            <p>Для работы интеграции требуются API credentials.</p>
            <p className="text-xs opacity-80">
              Их можно получить на{' '}
              <a
                href="https://my.telegram.org"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline hover:opacity-100"
              >
                my.telegram.org
              </a>
            </p>
          </div>
        </div>

        <form id="telegram-form" className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="telegram-phone" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              Номер телефона
            </Label>
            <Input
              id="telegram-phone"
              type="tel"
              value={formState.phoneNumber}
              onChange={handlePhoneChange}
              placeholder="+79998887766"
              disabled={isDisabled}
              className="bg-background/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telegram-api-id" className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              API ID
            </Label>
            <Input
              id="telegram-api-id"
              type="number"
              value={formState.apiId}
              onChange={handleApiIdChange}
              placeholder="12345678"
              disabled={isDisabled}
              className="bg-background/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telegram-api-hash" className="flex items-center gap-2">
              <Key className="h-4 w-4 text-muted-foreground" />
              API Hash
            </Label>
            <Input
              id="telegram-api-hash"
              value={formState.apiHash}
              onChange={handleApiHashChange}
              placeholder="abcdef1234567890..."
              disabled={isDisabled}
              className="bg-background/50 font-mono text-xs"
            />
          </div>
        </form>
      </CardContent>
      <CardFooter className="mt-auto border-t border-border/50 bg-background/30 pt-4">
        <Button
          type="submit"
          form="telegram-form"
          className="w-full"
          disabled={isDisabled}
          variant="secondary"
        >
          {isSaving ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Сохраняем...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Сохранить настройки
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

