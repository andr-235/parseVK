export const handleRowClick = <T extends { id: number | string }>(
  e: React.MouseEvent<HTMLDivElement>,
  dataArray: T[],
  onSelect: (id: T['id']) => void
) => {
  const target = e.target as HTMLElement
  const row = target.closest('tr')

  if (row && row.parentElement?.tagName === 'TBODY') {
    const index = Array.from(row.parentElement.children).indexOf(row)
    if (index >= 0 && dataArray[index]) {
      onSelect(dataArray[index].id)
    }
  }
}
