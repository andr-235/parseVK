export function DateCell({ value }: { value: string | null | undefined }) {
  return (
    <td className="px-3 py-2 text-sm text-text-secondary tabular-nums">
      {value ? new Date(value).toLocaleDateString('ru-RU') : '\u2014'}
    </td>
  )
}
