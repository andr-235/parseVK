import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import TelegramDlUploadPage from '../components/TelegramDlUploadPage'

describe('TelegramDlUploadPage', () => {
  it('renders the upload shell and history placeholder', () => {
    render(<TelegramDlUploadPage />)

    expect(screen.getByText('Выгрузка с ДЛ')).toBeInTheDocument()
    expect(screen.getByText(/Можно выбрать несколько XLSX файлов/)).toBeInTheDocument()
    expect(screen.getByText('История загрузок')).toBeInTheDocument()
    expect(screen.getByText(/Пока нет загруженных файлов/)).toBeInTheDocument()
  })

  it('tracks multiple selected files in the upload card', () => {
    render(<TelegramDlUploadPage />)

    const input = document.querySelector('input[type="file"]') as HTMLInputElement | null
    expect(input).not.toBeNull()

    const files = [
      new File(['a'], 'groupexport_ab3army_2024-10-15.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
      new File(['b'], 'groupexport_center_ma_2024-03-16.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
    ]

    fireEvent.change(input!, { target: { files } })

    expect(screen.getByText('Выбрано файлов: 2')).toBeInTheDocument()
    expect(screen.getByText('groupexport_ab3army_2024-10-15.xlsx')).toBeInTheDocument()
    expect(screen.getByText('groupexport_center_ma_2024-03-16.xlsx')).toBeInTheDocument()
  })
})
