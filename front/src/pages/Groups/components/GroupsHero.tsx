import PageTitle from '../../../components/PageTitle'
import styles from './GroupsHero.module.css'

type GroupsHeroProps = {
  isLoading: boolean
  totalGroups: number
  hasGroups: boolean
}

function GroupsHero({ isLoading, totalGroups, hasGroups }: GroupsHeroProps) {
  const badgeClassName = `${styles.statusBadge} ${isLoading ? styles.statusBadgeLoading : styles.statusBadgeReady}`

  return (
    <section className={styles.hero}>
      <div className={styles.overview}>
        <div className={styles.header}>
          <PageTitle>Группы</PageTitle>
          <p className={styles.subtitle}>
            Управляйте списком сообществ: добавляйте новые источники вручную, импортируйте их из файлов и
            отслеживайте состояние каталога. Ниже — быстрый срез по количеству и статусу обновления данных.
          </p>
        </div>

        <div className={styles.statsGrid}>
          <article className={`${styles.statCard} ${styles.statCardPrimary}`}>
            <header className={styles.statHeader}>
              <span className={styles.statLabel}>Всего групп</span>
            </header>
            <div className={styles.statValueRow}>
              <span className={styles.statValue}>{isLoading ? '—' : totalGroups}</span>
              {!isLoading && (
                <span className={styles.statBadgeSoft}>
                  {hasGroups ? 'Каталог активен' : 'Пока пусто'}
                </span>
              )}
            </div>
            <p className={styles.statDescription}>
              {isLoading
                ? 'Получаем актуальные данные — таблица ниже обновится автоматически.'
                : hasGroups
                  ? 'Список готов к работе: управляйте сообществами и следите за их состоянием ниже.'
                  : 'Список пуст. Добавьте первую группу или воспользуйтесь импортом, чтобы начать анализ.'}
            </p>
          </article>

          <article className={styles.statCard}>
            <header className={styles.statHeader}>
              <span className={styles.statLabel}>Статус синхронизации</span>
            </header>
            <span className={badgeClassName}>
              {isLoading ? 'Обновляем данные' : 'Актуальные данные'}
            </span>
            <p className={styles.statDescription}>
              {isLoading
                ? 'Это займёт немного времени. Мы загрузим и проверим новые записи.'
                : hasGroups
                  ? 'Последняя синхронизация прошла успешно. Новые данные отображаются в таблице.'
                  : 'Как только вы добавите группы, здесь появится статус их последней загрузки.'}
            </p>
          </article>
        </div>
      </div>

      <aside className={styles.guide}>
        <div className={styles.guideCard}>
          <h2 className={styles.guideTitle}>Как начать работу</h2>
          <p className={styles.guideIntro}>
            Следуйте шагам, чтобы быстро собрать каталог сообществ и подготовить данные к анализу.
          </p>
          <ol className={styles.guideList}>
            <li className={styles.guideItem}>
              <span className={styles.stepBadge}>1</span>
              <div>
                <h3 className={styles.stepTitle}>Добавьте ссылку</h3>
                <p className={styles.stepText}>Вставьте URL сообщества ВК и нажмите «Добавить».</p>
              </div>
            </li>
            <li className={styles.guideItem}>
              <span className={styles.stepBadge}>2</span>
              <div>
                <h3 className={styles.stepTitle}>Импортируйте файл</h3>
                <p className={styles.stepText}>Загрузите текстовый список ссылок, чтобы ускорить наполнение.</p>
              </div>
            </li>
            <li className={styles.guideItem}>
              <span className={styles.stepBadge}>3</span>
              <div>
                <h3 className={styles.stepTitle}>Проверьте статус</h3>
                <p className={styles.stepText}>Отслеживайте прогресс — новые записи сразу появятся в таблице.</p>
              </div>
            </li>
          </ol>
        </div>
      </aside>
    </section>
  )
}

export default GroupsHero
