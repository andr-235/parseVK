import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/sheet'
import type { Keyword } from '@/types'
import type { IKeywordFormsResponse } from '@/modules/keywords/api/keywords.api'

interface KeywordFormsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  keyword: Keyword | null
  forms: IKeywordFormsResponse | null
  isLoading: boolean
  manualFormValue: string
  exclusionValue: string
  onManualFormChange: (value: string) => void
  onExclusionChange: (value: string) => void
  onAddManualForm: () => void | Promise<void>
  onRemoveManualForm: (form: string) => void | Promise<void>
  onAddExclusion: () => void | Promise<void>
  onRemoveExclusion: (form: string) => void | Promise<void>
}

function renderFormBadges(
  forms: string[],
  emptyLabel: string,
  onRemove?: (form: string) => void | Promise<void>
) {
  if (forms.length === 0) {
    return <div className="text-sm text-muted-foreground">{emptyLabel}</div>
  }

  return (
    <div className="flex flex-wrap gap-2">
      {forms.map((form) => (
        <div
          key={form}
          className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-sm"
        >
          <span>{form}</span>
          {onRemove ? (
            <button
              type="button"
              className="text-muted-foreground transition hover:text-destructive"
              onClick={() => onRemove(form)}
            >
              удалить
            </button>
          ) : null}
        </div>
      ))}
    </div>
  )
}

export function KeywordFormsSheet({
  open,
  onOpenChange,
  keyword,
  forms,
  isLoading,
  manualFormValue,
  exclusionValue,
  onManualFormChange,
  onExclusionChange,
  onAddManualForm,
  onRemoveManualForm,
  onAddExclusion,
  onRemoveExclusion,
}: KeywordFormsSheetProps) {
  const isPhrase = keyword?.isPhrase === true

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-[560px]">
        <SheetHeader className="border-b border-border/60 pb-4">
          <div className="flex items-center gap-2 pr-8">
            <SheetTitle className="text-xl">{keyword?.word ?? 'Формы ключевого слова'}</SheetTitle>
            {keyword ? (
              <Badge variant={isPhrase ? 'outline' : 'secondary'}>
                {isPhrase ? 'Фраза' : 'Слово'}
              </Badge>
            ) : null}
          </div>
          <SheetDescription>
            Управление словоформами и исключениями для точного контроля keyword matching.
          </SheetDescription>
        </SheetHeader>

        {!keyword ? null : (
          <div className="flex flex-col gap-4 p-4">
            <Card className="border-border/60 bg-background/70">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Автосгенерированные формы</CardTitle>
                <CardDescription>
                  Эти формы собираются backend-ом и участвуют в матчинге автоматически.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading
                  ? 'Загрузка…'
                  : renderFormBadges(forms?.generatedForms ?? [], 'Нет автосгенерированных форм')}
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-background/70">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Ручные формы</CardTitle>
                <CardDescription>
                  Добавляйте нестандартные варианты, которые не покрывает морфология.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isPhrase ? (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                    Для фраз ручные формы отключены. Используйте только исходную фразу.
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <Input
                        value={manualFormValue}
                        onChange={(event) => onManualFormChange(event.target.value)}
                        placeholder="Например: ауешница"
                      />
                      <Button
                        onClick={() => void onAddManualForm()}
                        disabled={!manualFormValue.trim()}
                      >
                        Добавить
                      </Button>
                    </div>
                    {isLoading
                      ? 'Загрузка…'
                      : renderFormBadges(
                          forms?.manualForms ?? [],
                          'Ручные формы пока не добавлены',
                          onRemoveManualForm
                        )}
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-background/70">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Исключения</CardTitle>
                <CardDescription>
                  Исключённые формы не будут возвращаться после регенерации generated-форм.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isPhrase ? (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                    Для фраз exclusions не применяются.
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <Input
                        value={exclusionValue}
                        onChange={(event) => onExclusionChange(event.target.value)}
                        placeholder="Например: клоуном"
                      />
                      <Button
                        onClick={() => void onAddExclusion()}
                        disabled={!exclusionValue.trim()}
                      >
                        Исключить
                      </Button>
                    </div>
                    {isLoading
                      ? 'Загрузка…'
                      : renderFormBadges(
                          forms?.exclusions ?? [],
                          'Исключения пока не заданы',
                          onRemoveExclusion
                        )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
