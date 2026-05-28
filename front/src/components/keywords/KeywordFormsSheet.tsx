import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { Keyword } from '@/types'
import type { IKeywordFormsResponse } from '@/api/keywords/keywords.api'
import { FormModal } from '@/components/common/FormModal'
import { Tag } from 'lucide-react'

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
    return <div className="text-xs text-text-secondary font-monitoring-body">{emptyLabel}</div>
  }

  return (
    <div className="flex flex-wrap gap-2">
      {forms.map((form) => (
        <div
          key={form}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-background-primary px-3 py-1 text-xs text-text-light font-monitoring-body"
        >
          <span>{form}</span>
          {onRemove ? (
            <button
              type="button"
              className="text-text-secondary transition hover:text-destructive text-[10px] font-bold uppercase font-mono-accent cursor-pointer"
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
    <FormModal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title={
        <div className="flex items-center gap-2">
          <span>{keyword?.word ?? 'Формы ключевого слова'}</span>
          {keyword ? (
            <Badge variant={isPhrase ? 'outline' : 'secondary'} className="h-5 px-2 text-[10px] uppercase font-mono-accent">
              {isPhrase ? 'Фраза' : 'Слово'}
            </Badge>
          ) : null}
        </div>
      }
      description="Управление словоформами и исключениями для точного контроля keyword matching."
      icon={<Tag className="h-5 w-5" />}
      isSaving={isLoading}
      widthClass="max-w-2xl"
    >
      {!keyword ? null : (
        <div className="flex flex-col gap-4 pt-2">
          <Card className="border-border bg-background-primary/20">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-text-light font-mono-accent">Автосгенерированные формы</CardTitle>
              <CardDescription className="text-xs text-text-secondary font-monitoring-body">
                Эти формы собираются backend-ом и участвуют в матчинге автоматически.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {isLoading
                ? <span className="text-xs text-text-secondary font-mono-accent">Загрузка…</span>
                : renderFormBadges(forms?.generatedForms ?? [], 'Нет автосгенерированных форм')}
            </CardContent>
          </Card>

          <Card className="border-border bg-background-primary/20">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-text-light font-mono-accent">Ручные формы</CardTitle>
              <CardDescription className="text-xs text-text-secondary font-monitoring-body">
                Добавляйте нестандартные варианты, которые не покрывает морфология.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-4 pb-4">
              {isPhrase ? (
                <div className="rounded-lg border border-warning-amber/20 bg-warning-amber/5 px-3 py-2 text-xs text-warning-amber font-monitoring-body">
                  Для фраз ручные формы отключены. Используйте только исходную фразу.
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <Input
                      value={manualFormValue}
                      onChange={(event) => onManualFormChange(event.target.value)}
                      placeholder="Например: ауешница"
                      className="h-10 border-border bg-background-primary text-text-light placeholder:text-text-secondary focus:border-accent-primary/50 focus:ring-accent-primary/20"
                    />
                    <Button
                      onClick={() => void onAddManualForm()}
                      disabled={!manualFormValue.trim()}
                      className="h-10 bg-accent-primary text-text-light hover:bg-accent-primary/95 transition-all"
                    >
                      Добавить
                    </Button>
                  </div>
                  {isLoading
                    ? <span className="text-xs text-text-secondary font-mono-accent">Загрузка…</span>
                    : renderFormBadges(
                        forms?.manualForms ?? [],
                        'Ручные формы пока не добавлены',
                        onRemoveManualForm
                      )}
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-border bg-background-primary/20">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-text-light font-mono-accent">Исключения</CardTitle>
              <CardDescription className="text-xs text-text-secondary font-monitoring-body">
                Исключённые формы не будут возвращаться после регенерации generated-форм.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-4 pb-4">
              {isPhrase ? (
                <div className="rounded-lg border border-warning-amber/20 bg-warning-amber/5 px-3 py-2 text-xs text-warning-amber font-monitoring-body">
                  Для фраз exclusions не применяются.
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <Input
                      value={exclusionValue}
                      onChange={(event) => onExclusionChange(event.target.value)}
                      placeholder="Например: клоуном"
                      className="h-10 border-border bg-background-primary text-text-light placeholder:text-text-secondary focus:border-accent-primary/50 focus:ring-accent-primary/20"
                    />
                    <Button
                      onClick={() => void onAddExclusion()}
                      disabled={!exclusionValue.trim()}
                      className="h-10 bg-accent-primary text-text-light hover:bg-accent-primary/95 transition-all"
                    >
                      Исключить
                    </Button>
                  </div>
                  {isLoading
                    ? <span className="text-xs text-text-secondary font-mono-accent">Загрузка…</span>
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
    </FormModal>
  )
}
