import { useState, useEffect } from 'react'
import { useGroupsStore } from '../stores'
import { getGroupTableColumns } from '../config/groupTableColumns'
import GroupsActionsPanel from './Groups/components/GroupsActionsPanel'
import './Groups.css'
import GroupsHero from './Groups/components/GroupsHero'
import GroupsTableCard from './Groups/components/GroupsTableCard'

function Groups() {
  const groups = useGroupsStore((state) => state.groups)
  const isLoading = useGroupsStore((state) => state.isLoading)
  const totalGroups = useGroupsStore((state) => state.groups.length)
  const hasGroups = useGroupsStore((state) => state.groups.length > 0)
  const fetchGroups = useGroupsStore((state) => state.fetchGroups)
  const addGroup = useGroupsStore((state) => state.addGroup)
  const deleteGroup = useGroupsStore((state) => state.deleteGroup)
  const loadFromFile = useGroupsStore((state) => state.loadFromFile)
  const deleteAllGroups = useGroupsStore((state) => state.deleteAllGroups)
  const [url, setUrl] = useState('')

  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  const handleAddGroup = async () => {
    if (await addGroup(url)) {
      setUrl('')
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      await loadFromFile(file)
    }
  }

  const handleDeleteAllGroups = async () => {
    if (!hasGroups || isLoading) {
      return
    }

    const confirmed = window.confirm('Удалить все группы из списка и базы данных? Это действие нельзя отменить.')
    if (!confirmed) {
      return
    }

    try {
      await deleteAllGroups()
    } catch {
      // Ошибки обрабатываются в сервисе
    }
  }

  return (
    <div className="groups-page">
      <GroupsHero
        isLoading={isLoading}
        totalGroups={totalGroups}
        hasGroups={hasGroups}
      />

      <GroupsActionsPanel
        onAdd={handleAddGroup}
        onUpload={handleFileUpload}
        isLoading={isLoading}
        url={url}
        setUrl={setUrl}
      />

      <GroupsTableCard
        groups={groups}
        isLoading={isLoading}
        onClear={handleDeleteAllGroups}
        onDelete={deleteGroup}
        columns={getGroupTableColumns}
      />
    </div>
  )
}

export default Groups
