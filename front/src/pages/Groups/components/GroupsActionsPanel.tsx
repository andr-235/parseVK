import type { ChangeEvent, Dispatch, SetStateAction } from 'react'
import GroupInput from '../../../components/GroupInput'
import FileUpload from '../../../components/FileUpload'
import styles from './GroupsActionsPanel.module.css'

interface GroupsActionsPanelProps {
  onAdd: () => Promise<void> | void
  onUpload: (event: ChangeEvent<HTMLInputElement>) => Promise<void> | void
  isLoading: boolean
  url: string
  setUrl: Dispatch<SetStateAction<string>>
}

function GroupsActionsPanel({ onAdd, onUpload, isLoading, url, setUrl }: GroupsActionsPanelProps) {
  const handleUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
    setUrl(event.target.value)
  }

  const handleAdd = () => {
    void onAdd()
  }

  return (
    <section className={styles.panel}>
      <header className={styles.header}>
        <h2 className={styles.title}>Добавление новых групп</h2>
        <p className={styles.subtitle}>
          Выберите подходящий способ: вставьте ссылку на сообщество или загрузите подготовленный файл.
          Мы подскажем, что делать дальше.
        </p>
      </header>

      <div className={styles.content}>
        <article className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.badge}>Шаг 1</span>
            <h3 className={styles.cardTitle}>Добавить вручную</h3>
          </div>
          <p className={styles.cardHint}>
            Вставьте URL сообщества ВК — мы проверим ссылку и автоматически добавим группу в список.
          </p>

          <GroupInput url={url} onUrlChange={handleUrlChange} onAdd={handleAdd} />

          <p className={styles.cardHelp}>
            Подсказка: можно вставить ссылку из адресной строки браузера. {isLoading && 'Подождите завершения текущей операции.'}
          </p>
        </article>

        <div className={styles.divider} aria-hidden="true" />

        <article className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.badge}>Шаг 2</span>
            <h3 className={styles.cardTitle}>Импорт из файла</h3>
          </div>
          <p className={styles.cardHint}>
            Загрузите текстовый файл со ссылками. Каждая ссылка должна находиться на новой строке.
          </p>

          <FileUpload onUpload={onUpload} buttonText="Загрузить из файла" />

          <p className={styles.cardHelp}>
            Мы обработаем файл и добавим все найденные сообщества автоматически. {isLoading && 'Импорт может занять некоторое время.'}
          </p>
        </article>
      </div>
    </section>
  )
}

export default GroupsActionsPanel
