export function NumCell({ value }: { value: number | null | undefined }) {
  return (
    <td className="px-3 py-2 text-sm text-text-secondary tabular-nums">
      {value !== null && value !== undefined ? value.toLocaleString('ru-RU') : '—'}
    </td>
  )
}
