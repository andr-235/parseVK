const UNITS = [
  { label: 'год', labelP: 'года', labelMany: 'лет', seconds: 31536000 },
  { label: 'месяц', labelP: 'месяца', labelMany: 'месяцев', seconds: 2592000 },
  { label: 'неделя', labelP: 'недели', labelMany: 'недель', seconds: 604800 },
  { label: 'день', labelP: 'дня', labelMany: 'дней', seconds: 86400 },
  { label: 'час', labelP: 'часа', labelMany: 'часов', seconds: 3600 },
  { label: 'минута', labelP: 'минуты', labelMany: 'минут', seconds: 60 },
] as const

function pluralRu(n: number, one: string, few: string, many: string): string {
  if (n % 10 === 1 && n % 100 !== 11) return one
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return few
  return many
}

export function relativeTime(date: string | Date): string {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (diff < 10) return 'только что'
  if (diff < 60) return `${diff} ${pluralRu(diff, 'секунда', 'секунды', 'секунд')} назад`
  for (const u of UNITS) {
    if (diff >= u.seconds) {
      const n = Math.floor(diff / u.seconds)
      return `${n} ${pluralRu(n, u.label, u.labelP, u.labelMany)} назад`
    }
  }
  return new Date(date).toLocaleDateString('ru-RU')
}
