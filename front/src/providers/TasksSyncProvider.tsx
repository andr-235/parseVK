import { useTasksSocket } from '@/hooks/useTasksSocket'
import { useTasksQuery } from '@/queries/useTasksQuery'

function TasksSyncProvider(): null {
  useTasksQuery()
  useTasksSocket()

  return null
}

export default TasksSyncProvider
