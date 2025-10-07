import { useState, useEffect } from 'react'
import PageTitle from '../components/PageTitle'
import Table from '../components/Table'
import GroupInput from '../components/GroupInput'
import FileUpload from '../components/FileUpload'
import { useGroupsStore } from '../stores'
import { getGroupTableColumns } from '../config/groupTableColumns'

function Groups() {
  const groups = useGroupsStore((state) => state.groups)
  const isLoading = useGroupsStore((state) => state.isLoading)
  const fetchGroups = useGroupsStore((state) => state.fetchGroups)
  const addGroup = useGroupsStore((state) => state.addGroup)
  const deleteGroup = useGroupsStore((state) => state.deleteGroup)
  const loadFromFile = useGroupsStore((state) => state.loadFromFile)
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
    file && await loadFromFile(file)
  }

  return (
    <div>
      <PageTitle>Группы</PageTitle>

      <div className="keywords-controls">
        <GroupInput
          url={url}
          onUrlChange={(e) => setUrl(e.target.value)}
          onAdd={handleAddGroup}
        />
        <FileUpload
          onUpload={handleFileUpload}
          buttonText="Загрузить из файла"
        />
      </div>

      <Table
        columns={getGroupTableColumns(deleteGroup)}
        data={groups}
        emptyMessage={isLoading ? "Загрузка..." : "Нет групп. Добавьте новую группу или загрузите из файла."}
      />
    </div>
  )
}

export default Groups
