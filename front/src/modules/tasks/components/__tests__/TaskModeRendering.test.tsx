import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { getTaskTableColumns } from '@/modules/tasks/config/taskTableColumns'
import { TaskStatsGrid } from '@/modules/tasks/components/TaskDetails/components/TaskStatsGrid'
import type { Task, TaskDetails } from '@/types'

const baseTask: Task = {
  id: 1,
  status: 'running',
  createdAt: '2026-03-16T00:00:00.000Z',
  groupsCount: 1,
  title: 'Перепроверка группы: Test',
  scope: 'SELECTED',
  mode: 'recheck_group',
  postLimit: null,
  groupIds: [1],
  stats: {
    groups: 1,
    processed: 0,
    processing: 1,
    pending: 0,
    posts: 2,
    comments: 5,
  },
}

describe('Task mode rendering', () => {
  it('показывает режим перепроверки в таблице без лимита постов', () => {
    const statusColumn = getTaskTableColumns().find((column) => column.key === 'status')

    expect(statusColumn).toBeDefined()

    render(<>{statusColumn?.render(baseTask, 0)}</>)

    expect(screen.getByText(/режим: перепроверка/i)).toBeInTheDocument()
    expect(screen.queryByText(/лимит постов:/i)).not.toBeInTheDocument()
  })

  it('показывает режим перепроверки в деталях без карточки лимита постов', () => {
    const task: TaskDetails = {
      ...baseTask,
      groups: [],
    }

    render(
      <TaskStatsGrid
        task={task}
        scopeLabel="Выбранные группы (1)"
        totalGroups={1}
        postsCount={2}
        commentsCountTotal={5}
      />
    )

    expect(screen.getByText('Режим')).toBeInTheDocument()
    expect(screen.getByText(/перепроверка группы/i)).toBeInTheDocument()
    expect(screen.queryByText('Лимит постов')).not.toBeInTheDocument()
  })
})
