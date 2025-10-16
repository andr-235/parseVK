import { memo, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SuspicionLevelBadge } from '@/components/SuspicionLevelBadge'
import type { AuthorCard as AuthorCardData, PhotoAnalysisSummaryLevel } from '@/types'

const CATEGORY_LABELS: Record<string, string> = {
  violence: 'Насилие',
  drugs: 'Наркотики',
  weapons: 'Оружие',
  nsfw: 'NSFW',
  extremism: 'Экстремизм',
  'hate speech': 'Ненависть',
}

const LEVEL_ORDER: Record<PhotoAnalysisSummaryLevel['level'], number> = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
  NONE: 0,
}

const formatDateTime = (value: string | null): string => {
  if (!value) {
    return 'Нет данных'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Нет данных'
  }

  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getInitials = (firstName: string, lastName: string): string => {
  const first = firstName?.[0] ?? ''
  const last = lastName?.[0] ?? ''
  return `${first}${last}`.toUpperCase() || 'VK'
}

const buildProfileUrl = (author: AuthorCardData): string => {
  if (author.profileUrl) {
    return author.profileUrl
  }

  if (author.domain) {
    return `https://vk.com/${author.domain}`
  }

  if (author.screenName) {
    return `https://vk.com/${author.screenName}`
  }

  return `https://vk.com/id${author.vkUserId}`
}

const AuthorCardComponent = ({ author }: { author: AuthorCardData }) => {
  const navigate = useNavigate()
  const { summary } = author

  const profileUrl = buildProfileUrl(author)
  const lastAnalyzed = formatDateTime(summary.lastAnalyzedAt)

  const categoryBadges = useMemo(
    () =>
      summary.categories.map((category) => {
        const label = CATEGORY_LABELS[category.name] ?? category.name
        const hasIncidents = category.count > 0
        return (
          <Badge
            key={category.name}
            variant={hasIncidents ? 'destructive' : 'outline'}
            className={
              hasIncidents
                ? 'border-destructive/40 bg-destructive/10 text-destructive text-xs font-medium'
                : 'border-border/60 text-xs text-text-secondary'
            }
          >
            {label}: {category.count}
          </Badge>
        )
      }),
    [summary.categories]
  )

  const highestLevel = useMemo(() => {
    const nonZero = summary.levels.filter((item) => item.count > 0)
    if (nonZero.length === 0) {
      return null
    }

    return nonZero.slice(1).reduce<PhotoAnalysisSummaryLevel>(
      (acc, item) => (LEVEL_ORDER[item.level] > LEVEL_ORDER[acc.level] ? item : acc),
      nonZero[0]
    )
  }, [summary.levels])

  const handleOpenAnalysis = () => {
    navigate(`/authors/${author.vkUserId}/analysis`, {
      state: {
        author: {
          vkUserId: author.vkUserId,
          firstName: author.firstName,
          lastName: author.lastName,
          fullName: author.fullName,
          avatar: author.photo200 ?? author.photo100 ?? author.photo50,
          profileUrl,
          screenName: author.screenName,
          domain: author.domain,
        },
        summary,
      },
    })
  }

  return (
    <Card className="flex h-full flex-col border border-border/40 bg-background-secondary/60 shadow-sm">
      <CardHeader className="flex flex-row items-start gap-4 pb-4">
        <Avatar className="h-16 w-16 border border-border/20">
          {author.photo200 || author.photo100 || author.photo50 ? (
            <AvatarImage
              src={author.photo200 ?? author.photo100 ?? author.photo50 ?? undefined}
              alt={author.fullName}
            />
          ) : (
            <AvatarFallback>{getInitials(author.firstName, author.lastName)}</AvatarFallback>
          )}
        </Avatar>

        <div className="flex flex-1 flex-col gap-2">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">{author.fullName}</h2>
            <p className="text-sm text-text-secondary">
              {author.screenName ? `@${author.screenName}` : `id${author.vkUserId}`}
            </p>
          </div>

          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-accent-primary hover:underline"
          >
            Открыть профиль VK
          </a>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="border-accent-primary/30 bg-accent-primary/5 text-accent-primary">
            Фото: {summary.total}
          </Badge>
          <Badge
            variant={summary.suspicious > 0 ? 'destructive' : 'secondary'}
            className={
              summary.suspicious > 0
                ? 'border-destructive/40 bg-destructive/10 text-destructive'
                : 'text-text-secondary'
            }
          >
            Подозрительных: {summary.suspicious}
          </Badge>
          <Badge variant="outline" className="border-border/50">
            Последний анализ: {lastAnalyzed}
          </Badge>
        </div>

        {highestLevel ? (
          <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-background-primary/40 px-3 py-2">
            <SuspicionLevelBadge level={highestLevel.level} />
            <span className="text-sm text-text-secondary">
              Количество фото с уровнем: {highestLevel.count}
            </span>
          </div>
        ) : (
          <div className="rounded-xl border border-border/40 bg-background-primary/40 px-3 py-2 text-sm text-text-secondary">
            Подозрительных уровней не обнаружено
          </div>
        )}

        <div>
          <span className="block text-xs font-semibold uppercase tracking-wide text-text-secondary/70">
            Категории
          </span>
          <div className="mt-2 flex flex-wrap gap-2">{categoryBadges}</div>
        </div>
      </CardContent>

      <Separator className="mx-6" />

      <CardFooter className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="outline" asChild>
          <a href={profileUrl} target="_blank" rel="noopener noreferrer">
            Профиль VK
          </a>
        </Button>
        <Button onClick={handleOpenAnalysis}>Анализ фото</Button>
      </CardFooter>
    </Card>
  )
}

const AuthorCard = memo(AuthorCardComponent)

export default AuthorCard
