import { memo, useMemo, useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import type { AuthorCard as AuthorCardData } from '@/types'
import {
  ChevronDown,
  ChevronUp,
  AlignLeft,
  AtSign,
  Cake,
  Heart,
  MapPin,
  Briefcase,
  Phone,
  User,
  GraduationCap,
  Sparkles,
  Shield,
  Users,
  Music,
  Film,
  Book,
  Tv,
  Smartphone,
  Tablet,
  Monitor,
} from 'lucide-react'

const numberFormatter = new Intl.NumberFormat('ru-RU')

// Utility: format relation
const formatRelation = (value?: number | null): string | null => {
  if (value == null || value === 0) return null
  const map: Record<number, string> = {
    1: 'Не женат / не замужем',
    2: 'Есть друг / подруга',
    3: 'Помолвлен(а)',
    4: 'Женат / замужем',
    5: 'Всё сложно',
    6: 'В активном поиске',
    7: 'Влюблён(а)',
    8: 'В гражданском браке',
  }
  return map[value] ?? null
}

// Utility: format sex
const formatSex = (value?: number | null): string | null => {
  if (value == null || value === 0) return null
  return value === 1 ? 'Женский' : value === 2 ? 'Мужской' : null
}

// Utility: get platform icon
const getPlatformIcon = (platform?: number | null): React.ElementType | null => {
  if (platform == null) return null

  const iconMap: Record<number, React.ElementType> = {
    1: Smartphone,    // Мобильная версия
    2: Smartphone,    // iPhone
    3: Tablet,        // iPad
    4: Smartphone,    // Android
    5: Smartphone,    // Windows Phone
    6: Monitor,       // Windows 10
    7: Monitor,       // Полная версия
  }

  return iconMap[platform] ?? null
}

// Utility: format last seen
const formatLastSeen = (
  lastSeen?: { time?: number | null; platform?: number | null } | null,
): { date: string | null; icon: React.ElementType | null } => {
  if (!lastSeen || lastSeen.time == null) {
    return { date: null, icon: null }
  }

  const date = new Date(lastSeen.time * 1000)
  const formattedDate = Number.isNaN(date.getTime())
    ? null
    : date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })

  const icon = getPlatformIcon(lastSeen.platform)

  return { date: formattedDate, icon }
}

// Component: Inline info item with icon
const InlineInfoItem = ({
  icon: Icon,
  value,
}: {
  icon: React.ElementType
  value: string | null
}) => {
  if (!value) return null
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 shrink-0 text-text-secondary/60" />
      <span className="text-sm text-text-primary">{value}</span>
    </div>
  )
}

// Component: Collapsible Section
const CollapsibleSection = ({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
  storageKey,
}: {
  title: string
  icon?: React.ElementType
  children: React.ReactNode
  defaultOpen?: boolean
  storageKey?: string
}) => {
  const [isOpen, setIsOpen] = useState(() => {
    if (!storageKey) return defaultOpen
    const stored = localStorage.getItem(storageKey)
    return stored !== null ? stored === 'true' : defaultOpen
  })

  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(storageKey, String(isOpen))
    }
  }, [isOpen, storageKey])

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
      <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-left hover:opacity-70">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 text-text-secondary/70" />}
          <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-text-secondary/60" />
        ) : (
          <ChevronDown className="h-4 w-4 text-text-secondary/60" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3">{children}</CollapsibleContent>
    </Collapsible>
  )
}

// Component: Simple field
const SimpleField = ({ label, value }: { label: string; value: string | null }) => {
  if (!value) return null
  return (
    <div className="flex flex-col gap-0.5 py-1">
      <span className="text-xs text-text-secondary/70">{label}</span>
      <span className="text-sm text-text-primary">{value}</span>
    </div>
  )
}

// Component: Last Seen Field with icon
const LastSeenField = ({
  label,
  date,
  icon: Icon
}: {
  label: string
  date: string | null
  icon: React.ElementType | null
}) => {
  if (!date) return null
  return (
    <div className="flex flex-col gap-0.5 py-1">
      <span className="text-xs text-text-secondary/70">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm text-text-primary">{date}</span>
        {Icon && <Icon className="h-4 w-4 text-text-secondary/60" />}
      </div>
    </div>
  )
}

const AuthorCardComponent = ({ author }: { author: AuthorCardData }) => {
  const { profile, stats, details } = author

  const relationLabel = useMemo(() => formatRelation(details.relation), [details.relation])
  const sexLabel = useMemo(() => formatSex(details.sex), [details.sex])
  const lastSeenData = useMemo(() => formatLastSeen(details.lastSeen), [details.lastSeen])

  // Prepare occupation name
  const occupationName = useMemo(() => {
    const occupation = (details.occupation ?? {}) as Record<string, unknown>
    return typeof occupation['name'] === 'string' && occupation['name'].trim()
      ? occupation['name']
      : null
  }, [details.occupation])

  // Prepare counters
  const counters = useMemo(() => {
    const items: Array<{ label: string; value: string }> = []
    const countersData = stats.counters || {}

    // Друзья
    if (countersData.friends && typeof countersData.friends === 'number' && countersData.friends > 0) {
      items.push({
        label: countersData.friends === 1
          ? 'друг'
          : countersData.friends < 5
            ? 'друга'
            : 'друзей',
        value: numberFormatter.format(countersData.friends),
      })
    }

    // Подписчики
    const followers = stats.followersCount || countersData.followers
    if (followers && followers > 0) {
      items.push({
        label: followers === 1
          ? 'подписчик'
          : followers < 5
            ? 'подписчика'
            : 'подписчиков',
        value: numberFormatter.format(followers),
      })
    }

    // Подписки
    if (countersData.subscriptions && typeof countersData.subscriptions === 'number' && countersData.subscriptions > 0) {
      items.push({
        label: countersData.subscriptions === 1
          ? 'подписка'
          : countersData.subscriptions < 5
            ? 'подписки'
            : 'подписок',
        value: numberFormatter.format(countersData.subscriptions),
      })
    }

    // Сообщества
    if (countersData.groups && typeof countersData.groups === 'number' && countersData.groups > 0) {
      items.push({
        label: countersData.groups === 1
          ? 'сообщество'
          : countersData.groups < 5
            ? 'сообщества'
            : 'сообществ',
        value: numberFormatter.format(countersData.groups),
      })
    }

    // Фотографии
    if (countersData.photos && typeof countersData.photos === 'number' && countersData.photos > 0) {
      items.push({
        label: countersData.photos === 1
          ? 'фотография'
          : countersData.photos < 5
            ? 'фотографии'
            : 'фотографий',
        value: numberFormatter.format(countersData.photos),
      })
    }

    // Видеозаписи
    if (countersData.videos && typeof countersData.videos === 'number' && countersData.videos > 0) {
      items.push({
        label: countersData.videos === 1
          ? 'видеозапись'
          : countersData.videos < 5
            ? 'видеозаписи'
            : 'видеозаписей',
        value: numberFormatter.format(countersData.videos),
      })
    }

    // Аудиозаписи
    if (countersData.audios && typeof countersData.audios === 'number' && countersData.audios > 0) {
      items.push({
        label: countersData.audios === 1
          ? 'аудиозапись'
          : countersData.audios < 5
            ? 'аудиозаписи'
            : 'аудиозаписей',
        value: numberFormatter.format(countersData.audios),
      })
    }

    return items
  }, [stats])

  // Prepare contacts
  const hasContacts = useMemo(() => {
    const contacts = details.contacts
    if (!contacts) return false
    return Object.values(contacts).some((val) => val && val.trim())
  }, [details.contacts])

  const contactsArray = useMemo(() => {
    const contacts = details.contacts
    if (!contacts) return []
    return Object.entries(contacts)
      .filter(([, val]) => val && val.trim())
      .map(([key, val]) => ({ key, value: val }))
  }, [details.contacts])

  // Prepare career
  const hasCareer = useMemo(() => {
    return Array.isArray(details.career) && details.career.length > 0
  }, [details.career])

  // Prepare education
  const hasEducation = useMemo(() => {
    const education = (details.education ?? {}) as Record<string, unknown>
    return (
      (typeof education['university_name'] === 'string' && education['university_name'].trim()) ||
      (typeof education['faculty_name'] === 'string' && education['faculty_name'].trim()) ||
      (Array.isArray(details.schools) && details.schools.length > 0) ||
      (Array.isArray(details.universities) && details.universities.length > 0)
    )
  }, [details.education, details.schools, details.universities])

  // Prepare personal values
  const personalValuesArray = useMemo(() => {
    const personal = (details.personal ?? {}) as Record<string, unknown>
    const items: Array<{ label: string; value: string }> = []

    const politicalLabels: Record<number, string> = {
      1: 'Коммунистические',
      2: 'Социалистические',
      3: 'Умеренные',
      4: 'Либеральные',
      5: 'Консервативные',
      6: 'Монархические',
      7: 'Ультраконсервативные',
      8: 'Индифферентные',
      9: 'Либертарианские',
    }

    const lifeMainLabels: Record<number, string> = {
      1: 'Семья и дети',
      2: 'Карьера и деньги',
      3: 'Развлечения и отдых',
      4: 'Наука и исследования',
      5: 'Совершенствование мира',
      6: 'Саморазвитие',
      7: 'Красота и искусство',
      8: 'Слава и влияние',
    }

    const peopleMainLabels: Record<number, string> = {
      1: 'Ум и креативность',
      2: 'Доброта и честность',
      3: 'Красота и здоровье',
      4: 'Власть и богатство',
      5: 'Смелость и упорство',
      6: 'Юмор и жизнерадостность',
    }

    const political = personal['political']
    if (typeof political === 'number' && politicalLabels[political]) {
      items.push({ label: 'Политические взгляды', value: politicalLabels[political] })
    }

    const lifeMain = personal['life_main']
    if (typeof lifeMain === 'number' && lifeMainLabels[lifeMain]) {
      items.push({ label: 'Главное в жизни', value: lifeMainLabels[lifeMain] })
    }

    const peopleMain = personal['people_main']
    if (typeof peopleMain === 'number' && peopleMainLabels[peopleMain]) {
      items.push({ label: 'Главное в людях', value: peopleMainLabels[peopleMain] })
    }

    const religion = personal['religion']
    if (typeof religion === 'string' && religion.trim()) {
      items.push({ label: 'Религия', value: religion.trim() })
    }

    const inspiredBy = personal['inspired_by']
    if (typeof inspiredBy === 'string' && inspiredBy.trim()) {
      items.push({ label: 'Источники вдохновения', value: inspiredBy.trim() })
    }

    return items
  }, [details.personal])

  // Prepare interests
  const interestsArray = useMemo(() => {
    const items: Array<{ label: string; value: string; icon: React.ElementType }> = []
    if (details.activities) items.push({ label: 'Деятельность', value: details.activities, icon: User })
    if (details.interests) items.push({ label: 'Интересы', value: details.interests, icon: Sparkles })
    if (details.music) items.push({ label: 'Любимая музыка', value: details.music, icon: Music })
    if (details.movies) items.push({ label: 'Любимые фильмы', value: details.movies, icon: Film })
    if (details.books) items.push({ label: 'Любимые книги', value: details.books, icon: Book })
    if (details.tv) items.push({ label: 'Телешоу', value: details.tv, icon: Tv })
    return items
  }, [details])

  // Prepare military
  const hasMilitary = useMemo(() => {
    return Array.isArray(details.military) && details.military.length > 0
  }, [details.military])

  // Prepare relatives
  const hasRelatives = useMemo(() => {
    return Array.isArray(details.relatives) && details.relatives.length > 0
  }, [details.relatives])

  return (
    <Card className="flex h-full flex-col overflow-hidden border border-border/30 bg-background-secondary/50 shadow-sm">
      <CardHeader className="border-b border-border/30 pb-5 pt-5">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 shrink-0 border border-border/40">
            {profile.avatar ? (
              <AvatarImage src={profile.avatar} alt={profile.fullName} />
            ) : (
              <AvatarFallback>
                {(profile.firstName?.[0] ?? '')}{profile.lastName?.[0] ?? ''}
              </AvatarFallback>
            )}
          </Avatar>

          <div className="flex flex-1 flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-text-primary">{profile.fullName}</h2>
              {profile.isClosed && (
                <Badge variant="secondary" className="text-xs">
                  Закрытый профиль
                </Badge>
              )}
              {profile.deactivated && (
                <Badge variant="destructive" className="text-xs">
                  {profile.deactivated === 'deleted'
                    ? 'Удалён'
                    : profile.deactivated === 'banned'
                      ? 'Заблокирован'
                      : 'Ограничен'}
                </Badge>
              )}
            </div>

            <a
              href={profile.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-accent-primary hover:underline"
            >
              vk.com/{profile.domain ?? `id${profile.vkUserId}`}
            </a>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-2 py-4">
        {/* About section with icon */}
        {details.about && (
          <>
            <div className="flex items-start gap-2 py-2">
              <AlignLeft className="mt-0.5 h-4 w-4 shrink-0 text-text-secondary/60" />
              <p className="text-sm leading-relaxed text-text-primary">{details.about}</p>
            </div>
            <Separator className="my-2" />
          </>
        )}

        {/* Key info with icons - inline */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 py-2">
          <InlineInfoItem icon={AtSign} value={`id${profile.vkUserId}`} />
          {details.bdate && <InlineInfoItem icon={Cake} value={details.bdate} />}
          {relationLabel && <InlineInfoItem icon={Heart} value={relationLabel} />}
          {details.city?.title && <InlineInfoItem icon={MapPin} value={details.city.title} />}
          {occupationName && <InlineInfoItem icon={Briefcase} value={occupationName} />}
        </div>

        {/* Counters */}
        {counters.length > 0 && (
          <>
            <Separator className="my-2" />
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 py-2">
              {counters.map((item, idx) => (
                <div key={idx} className="flex flex-col items-center gap-0.5">
                  <span className="text-sm font-semibold text-text-primary">{item.value}</span>
                  <span className="text-xs text-text-secondary/60">{item.label}</span>
                </div>
              ))}
            </div>
          </>
        )}

        <Separator className="my-3" />

        {/* Collapsible Sections */}
        <div className="space-y-4">
          {/* Personal Information */}
          {(details.homeTown || details.country?.title || sexLabel || lastSeenData.date) && (
            <CollapsibleSection
              title="Личная информация"
              icon={User}
              storageKey={`author-${author.id}-personal-v2`}
            >
              <div className="space-y-2">
                <SimpleField label="Родной город" value={details.homeTown} />
                <SimpleField label="Страна" value={details.country?.title ?? null} />
                <SimpleField label="Пол" value={sexLabel} />
                <LastSeenField label="Последний визит" date={lastSeenData.date} icon={lastSeenData.icon} />
              </div>
            </CollapsibleSection>
          )}

          {/* Contacts */}
          {(hasContacts || details.site) && (
            <CollapsibleSection
              title="Контактная информация"
              icon={Phone}
              storageKey={`author-${author.id}-contacts-v2`}
            >
              <div className="space-y-2">
                {contactsArray.map((contact) => (
                  <SimpleField key={contact.key} label={contact.key} value={contact.value} />
                ))}
                {details.site && (
                  <div className="flex flex-col gap-0.5 py-1">
                    <span className="text-xs text-text-secondary/70">Сайт</span>
                    <a
                      href={details.site.startsWith('http') ? details.site : `https://${details.site}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-accent-primary hover:underline"
                    >
                      {details.site}
                    </a>
                  </div>
                )}
              </div>
            </CollapsibleSection>
          )}

          {/* Career */}
          {hasCareer && (
            <CollapsibleSection
              title="Место работы"
              icon={Briefcase}
              storageKey={`author-${author.id}-career-v2`}
            >
              <div className="space-y-3">
                {details.career?.map((item, idx) => {
                  const careerItem = item as Record<string, unknown>
                  const company = typeof careerItem.company === 'string' ? careerItem.company : null
                  const position = typeof careerItem.position === 'string' ? careerItem.position : null
                  const cityName = typeof careerItem.city_name === 'string' ? careerItem.city_name : null
                  const from = typeof careerItem.from === 'number' ? careerItem.from : null
                  const until = typeof careerItem.until === 'number' ? careerItem.until : null

                  let period = null
                  if (from && until) {
                    period = `${from} — ${until}`
                  } else if (from) {
                    period = `с ${from}`
                  } else if (until) {
                    period = `по ${until}`
                  }

                  return (
                    <div key={idx} className="space-y-1 rounded-lg border border-border/30 bg-background-primary/30 p-3">
                      {company && <div className="font-medium text-text-primary">{company}</div>}
                      {position && <div className="text-sm text-text-secondary">{position}</div>}
                      {cityName && <div className="text-xs text-text-secondary/70">{cityName}</div>}
                      {period && <div className="text-xs text-text-secondary/70">{period}</div>}
                    </div>
                  )
                })}
              </div>
            </CollapsibleSection>
          )}

          {/* Education */}
          {hasEducation && (
            <CollapsibleSection
              title="Образование"
              icon={GraduationCap}
              storageKey={`author-${author.id}-education-v2`}
            >
              <div className="space-y-2">
                {(() => {
                  const education = (details.education ?? {}) as Record<string, unknown>
                  const university = typeof education['university_name'] === 'string' && education['university_name'].trim()
                  const faculty = typeof education['faculty_name'] === 'string' && education['faculty_name'].trim()

                  if (university || faculty) {
                    return (
                      <div className="space-y-1">
                        {university && <SimpleField label="ВУЗ" value={university} />}
                        {faculty && <SimpleField label="Факультет" value={faculty} />}
                      </div>
                    )
                  }
                  return null
                })()}
                {details.schools && details.schools.length > 0 && (
                  <div className="text-sm text-text-secondary">
                    {details.schools.length} {details.schools.length === 1 ? 'школа' : 'школ'}
                  </div>
                )}
                {details.universities && details.universities.length > 0 && (
                  <div className="text-sm text-text-secondary">
                    {details.universities.length} {details.universities.length === 1 ? 'университет' : 'университетов'}
                  </div>
                )}
              </div>
            </CollapsibleSection>
          )}

          {/* Life position */}
          {personalValuesArray.length > 0 && (
            <CollapsibleSection
              title="Жизненная позиция"
              icon={Heart}
              storageKey={`author-${author.id}-values-v2`}
            >
              <div className="space-y-2">
                {personalValuesArray.map((item, idx) => (
                  <SimpleField key={idx} label={item.label} value={item.value} />
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* Interests */}
          {interestsArray.length > 0 && (
            <CollapsibleSection
              title="Интересы и медиа"
              icon={Music}
              storageKey={`author-${author.id}-interests-v2`}
            >
              <div className="space-y-3">
                {interestsArray.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <item.icon className="h-4 w-4 text-text-secondary/60" />
                      <span className="text-xs font-medium text-text-secondary/70">{item.label}</span>
                    </div>
                    <p className="text-sm leading-relaxed text-text-primary">{item.value}</p>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* Military */}
          {hasMilitary && (
            <CollapsibleSection
              title="Военная служба"
              icon={Shield}
              storageKey={`author-${author.id}-military-v2`}
            >
              <div className="space-y-3">
                {details.military?.map((item, idx) => {
                  const militaryItem = item as Record<string, unknown>
                  const unit = typeof militaryItem.unit === 'string' ? militaryItem.unit : null
                  const from = typeof militaryItem.from === 'number' ? militaryItem.from : null
                  const until = typeof militaryItem.until === 'number' ? militaryItem.until : null

                  let period = null
                  if (from && until) {
                    period = `${from} — ${until}`
                  } else if (from) {
                    period = `с ${from}`
                  } else if (until) {
                    period = `по ${until}`
                  }

                  return (
                    <div key={idx} className="space-y-1">
                      {unit && <SimpleField label="Часть" value={unit} />}
                      {period && <SimpleField label="Период" value={period} />}
                    </div>
                  )
                })}
              </div>
            </CollapsibleSection>
          )}

          {/* Relatives */}
          {hasRelatives && (
            <CollapsibleSection
              title="Родственные связи"
              icon={Users}
              storageKey={`author-${author.id}-relatives-v2`}
            >
              <div className="space-y-2">
                {details.relatives?.map((item, idx) => {
                  const relativeItem = item as Record<string, unknown>
                  const name = typeof relativeItem.name === 'string' ? relativeItem.name : null
                  const type = typeof relativeItem.type === 'string' ? relativeItem.type : null

                  const relativeTypeLabels: Record<string, string> = {
                    child: 'Ребёнок',
                    sibling: 'Брат / сестра',
                    parent: 'Родитель',
                    grandparent: 'Дедушка / бабушка',
                    grandchild: 'Внук / внучка',
                  }

                  const typeLabel = type ? relativeTypeLabels[type] ?? type : null

                  if (!name) return null

                  return (
                    <div key={idx} className="text-sm text-text-primary">
                      {name} {typeLabel && <span className="text-text-secondary/70">({typeLabel})</span>}
                    </div>
                  )
                })}
              </div>
            </CollapsibleSection>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

const AuthorCard = memo(AuthorCardComponent)

export default AuthorCard
