export const getTaskStatusText = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'Ожидание'
    case 'processing':
      return 'В обработке'
    case 'running':
      return 'Выполняется'
    case 'completed':
      return 'Завершена'
    case 'failed':
      return 'Ошибка'
    default:
      return status
  }
}

export const getGroupStatusText = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'Ожидание'
    case 'processing':
      return 'В обработке'
    case 'running':
      return 'Выполняется'
    case 'success':
      return 'Успешно'
    case 'failed':
      return 'Ошибка'
    default:
      return status
  }
}

