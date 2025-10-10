import { useState, useEffect, type ChangeEvent } from 'react'
import { useGroupsStore } from '../stores'
import { getGroupTableColumns } from '../config/groupTableColumns'
import { Separator } from '@/components/ui/separator'
import GroupsHero from './Groups/components/GroupsHero'
import GroupsActionsPanel from './Groups/components/GroupsActionsPanel'
import GroupsTableCard from './Groups/components/GroupsTableCard'
import { Card } from '@/components/ui/card'

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
    <Card className="flex flex-col gap-8">
      <GroupsHero />

      <Separator className="opacity-40" />

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
    </Card>
  )
}

export default Groups
