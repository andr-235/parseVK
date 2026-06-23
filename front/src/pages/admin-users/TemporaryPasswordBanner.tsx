import { KeyRound, X } from 'lucide-react'
import { Button } from '../../components/ui'

type Props = { password: string; onClose: () => void }

export function TemporaryPasswordBanner({ password, onClose }: Props) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-md border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning" role="status">
      <KeyRound size={16} aria-hidden="true" />
      <span>
        Временный пароль: <strong className="font-mono">{password}</strong>
      </span>
      <span className="text-xs">Сохраните его сейчас: повторно он не отображается.</span>
      <Button
        variant="secondary"
        size="xs"
        semantic="warning"
        className="ml-auto"
        onClick={onClose}
        icon={<X size={12} />}
      >
        Скрыть
      </Button>
    </div>
  )
}
