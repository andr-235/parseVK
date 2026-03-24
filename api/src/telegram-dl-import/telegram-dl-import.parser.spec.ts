import ExcelJS from 'exceljs'
import { describe, expect, it } from 'vitest'
import {
  TelegramDlImportParser,
  type TelegramDlImportRow,
} from './telegram-dl-import.parser.js'

const createWorkbookBuffer = async (
  headers: string[],
  rows: Array<Array<unknown>>,
  sheetName = 'Sheet1'
): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet(sheetName)
  worksheet.addRow(headers)
  rows.forEach((row) => worksheet.addRow(row))

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

const expectRow = (row: TelegramDlImportRow) => row

describe('TelegramDlImportParser', () => {
  const parser = new TelegramDlImportParser()

  it('использует полное имя файла как ключ замены', () => {
    expect(
      parser.getReplacementKey('groupexport_ab3army_2024-10-15.xlsx')
    ).toBe('groupexport_ab3army_2024-10-15.xlsx')
  })

  it('парсит старый формат и пропускает пустые строки', async () => {
    const buffer = await createWorkbookBuffer(
      [
        'Id',
        'Username',
        'Телефон',
        'Имя',
        'Фамилия',
        'Описание',
        'Регион',
        'Дата',
        'Каналы',
      ],
      [
        [
          '655140602',
          'AZL2054',
          '18016003139',
          'AZL2054',
          null,
          null,
          null,
          '2022-11-15 18:08:40',
          'https://t.me/+4AIahuktDjQxMmU6',
        ],
        [null, null, null, null, null, null, null, null, null],
        ['1702659855', '  ', '79011918630', '  Михаил  ', 'Фролов', null, 'Ивановская обл.', '2021-07-14 01:07:00', 'https://t.me/mediapartisanschat'],
      ]
    )

    const result = await parser.parse(buffer, 'groupexport_center_ma_2024-03-16.xlsx')

    expect(result.originalFileName).toBe('groupexport_center_ma_2024-03-16.xlsx')
    expect(result.replacementKey).toBe('groupexport_center_ma_2024-03-16.xlsx')
    expect(result.contacts).toHaveLength(2)
    expect(result.contacts[0]).toEqual(
      expectRow({
        sourceRowIndex: 2,
        telegramId: '655140602',
        username: 'AZL2054',
        phone: '18016003139',
        firstName: 'AZL2054',
        lastName: null,
        description: null,
        region: null,
        date: '2022-11-15 18:08:40',
        channels: 'https://t.me/+4AIahuktDjQxMmU6',
        fullName: null,
        address: null,
        vkUrl: null,
        email: null,
        telegramContact: null,
        instagram: null,
        viber: null,
        odnoklassniki: null,
        birthDate: null,
        usernameExtra: null,
        geo: null,
      })
    )
    expect(result.contacts[1].firstName).toBe('Михаил')
    expect(result.contacts[1].username).toBeNull()
  })

  it('различает два столбца Username по позиции', async () => {
    const buffer = await createWorkbookBuffer(
      [
        'Id',
        'Username',
        'Телефон',
        'Имя',
        'Фамилия',
        'Описание',
        'Регион',
        'Дата',
        'Каналы',
        'ФИО',
        'Адрес',
        'Вконтакте',
        'Почта',
        'Телеграм',
        'Инстаграм',
        'Viber',
        'Одноклассники',
        'Дата рождения',
        'Username',
        'Гео',
      ],
      [
        [
          '958047712',
          'foxsquad46',
          '79130893744',
          'Упоротый',
          'Лис',
          null,
          'Алтайский край',
          '2023-05-04 07:23:30',
          'https://t.me/+4AIahuktDjQxMmU6',
          'ФИО',
          'Адрес',
          'vk',
          'mail@example.com',
          '@tg_contact',
          'insta',
          'viber',
          'ok',
          '1990-01-01',
          'foxsquad46_extra',
          'Гео',
        ],
      ]
    )

    const result = await parser.parse(buffer, 'groupexport_ab3army_2024-10-15.xlsx')

    expect(result.contacts).toHaveLength(1)
    expect(result.contacts[0].username).toBe('foxsquad46')
    expect(result.contacts[0].usernameExtra).toBe('foxsquad46_extra')
    expect(result.contacts[0].telegramContact).toBe('@tg_contact')
  })

  it.each(['Id', 'Телефон', 'Дата'] as const)(
    'отклоняет файл без обязательной колонки %s',
    async (missingColumn) => {
      const headers = ['Id', 'Телефон', 'Дата'].filter(
        (header) => header !== missingColumn
      )
      const buffer = await createWorkbookBuffer(headers, [
        headers.map((header) => `${header}-value`),
      ])

      await expect(
        parser.parse(buffer, 'groupexport_missing.xlsx')
      ).rejects.toThrow(`Отсутствуют обязательные колонки: ${missingColumn}`)
    }
  )
})
