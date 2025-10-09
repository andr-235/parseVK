import { useState, useEffect, type ChangeEvent } from 'react'
import { useGroupsStore } from '../stores'
import { getGroupTableColumns } from '../config/groupTableColumns'
import GroupsHero from './Groups/components/GroupsHero'
import GroupsActionsPanel from './Groups/components/GroupsActionsPanel'
import GroupsTableCard from './Groups/components/GroupsTableCard'

function Groups() {
  const groups = useGroupsStore((state) => state.groups)
  const isLoading = useGroupsStore((state) => state.isLoading)
  const fetchGroups = useGroupsStore((state) => state.fetchGroups)
  const addGroup = useGroupsStore((state) => state.addGroup)
  const deleteGroup = useGroupsStore((state) => state.deleteGroup)
  const loadFromFile = useGroupsStore((state) => state.loadFromFile)
  const deleteAllGroups = useGroupsStore((state) => state.deleteAllGroups)
  const [url, setUrl] = useState('')

  const groupsCount = groups.length
  const hasGroups = groupsCount > 0

  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  const handleAddGroup = async () => {
    if (await addGroup(url)) {
      setUrl('')
    }
  }

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
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
    <div className="flex flex-col gap-8 md:gap-10 px-4 sm:px-6 lg:px-8 pb-12 lg:pb-16">
      <GroupsHero />

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
