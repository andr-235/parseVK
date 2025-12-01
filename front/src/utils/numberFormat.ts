const numberFormatter = new Intl.NumberFormat('ru-RU')

export const formatNumber = (value: number): string => {
  return numberFormatter.format(Math.max(0, Math.round(value)))
}

export const declOfNumber = (count: number, titles: [string, string, string]): string => {
  const cases = [2, 0, 1, 1, 1, 2]
  return titles[count % 100 > 4 && count % 100 < 20 ? 2 : cases[Math.min(count % 10, 5)]]
}

