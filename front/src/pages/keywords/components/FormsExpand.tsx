import { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, X, Loader2, BookOpen } from 'lucide-react'
import { Button, Input } from '../../../components/ui'
import {
  fetchKeywordForms,
  addManualForm,
  deleteManualForm,
  addFormExclusion,
  deleteFormExclusion,
  type KeywordForm,
} from '../../../shared/api/keywords'

type Props = { keywordId: number }

export function FormsExpand({ keywordId }: Props) {
  const queryClient = useQueryClient()
  const [newForm, setNewForm] = useState('')
  const [newExclusion, setNewExclusion] = useState('')

  const queryKey = useMemo(() => ['keywordForms', keywordId] as const, [keywordId])

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchKeywordForms(keywordId),
  })

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey })
  }, [queryClient, queryKey])

  const addFormMut = useMutation({
    mutationFn: () => addManualForm(keywordId, newForm.trim()),
    onSuccess: () => { setNewForm(''); invalidate() },
  })

  const deleteFormMut = useMutation({
    mutationFn: (form: string) => deleteManualForm(keywordId, form),
    onSuccess: invalidate,
  })

  const addExclusionMut = useMutation({
    mutationFn: () => addFormExclusion(keywordId, newExclusion.trim()),
    onSuccess: () => { setNewExclusion(''); invalidate() },
  })

  const deleteExclusionMut = useMutation({
    mutationFn: (form: string) => deleteFormExclusion(keywordId, form),
    onSuccess: invalidate,
  })

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-6 py-3 text-xs text-text-muted">
        <Loader2 size={12} className="animate-spin" />
        Загрузка форм...
      </div>
    )
  }

  const forms: KeywordForm[] = data?.forms ?? []
  const exclusions: string[] = data?.exclusions ?? []

  const generatedForms = forms.filter((f) => f.source === 'generated')
  const manualForms = forms.filter((f) => f.source === 'manual')

  return (
    <div className="border-t border-border px-6 py-4">
      <div className="mb-3 flex items-center gap-2 text-xs font-medium text-text-secondary">
        <BookOpen size={13} />
        Формы словоизменения
      </div>

      {generatedForms.length > 0 && (
        <div className="mb-3">
          <p className="mb-1.5 text-xs text-text-muted">Автоматически сгенерированные</p>
          <div className="flex flex-wrap gap-1.5">
            {generatedForms.map((f) => (
              <span
                key={f.id}
                className="inline-flex items-center gap-1 rounded-sm bg-bg-panel px-2 py-0.5 text-xs text-text-secondary"
              >
                {f.form}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mb-3">
        <p className="mb-1.5 text-xs text-text-muted">Ручные формы</p>
        {manualForms.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {manualForms.map((f) => (
              <span
                key={f.id}
                className="inline-flex items-center gap-1 rounded-sm bg-bg-panel px-2 py-0.5 text-xs text-text-secondary"
              >
                {f.form}
                <button
                  type="button"
                  onClick={() => deleteFormMut.mutate(f.form)}
                  className="ml-0.5 text-text-muted hover:text-danger transition-colors duration-150"
                  aria-label={`Удалить форму ${f.form}`}
                >
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-text-muted">Нет ручных форм</p>
        )}
      </div>

      <div className="mb-4 flex items-center gap-2">
        <Input
          type="text"
          value={newForm}
          onChange={(e) => setNewForm(e.target.value)}
          placeholder="Добавить форму..."
          className="h-7 text-xs"
          aria-label="Новая форма словоизменения"
        />
        <Button
          variant="primary"
          size="xs"
          onClick={() => addFormMut.mutate()}
          disabled={!newForm.trim() || addFormMut.isPending}
          icon={<Plus size={12} />}
        >
          Добавить
        </Button>
      </div>

      {exclusions.length > 0 && (
        <div className="mb-3">
          <p className="mb-1.5 text-xs text-text-muted">Исключения</p>
          <div className="flex flex-wrap gap-1.5">
            {exclusions.map((f) => (
              <span
                key={f}
                className="inline-flex items-center gap-1 rounded-sm bg-danger/10 px-2 py-0.5 text-xs text-danger"
              >
                {f}
                <button
                  type="button"
                  onClick={() => deleteExclusionMut.mutate(f)}
                  className="ml-0.5 text-danger/60 hover:text-danger transition-colors duration-150"
                  aria-label={`Удалить исключение ${f}`}
                >
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Input
          type="text"
          value={newExclusion}
          onChange={(e) => setNewExclusion(e.target.value)}
          placeholder="Исключить форму..."
          className="h-7 text-xs"
          aria-label="Новое исключение формы"
        />
        <Button
          variant="soft"
          semantic="danger"
          size="xs"
          onClick={() => addExclusionMut.mutate()}
          disabled={!newExclusion.trim() || addExclusionMut.isPending}
          icon={<Plus size={12} />}
        >
          Исключить
        </Button>
      </div>
    </div>
  )
}
