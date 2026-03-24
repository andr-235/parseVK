import path from 'node:path'
import ExcelJS from 'exceljs'

const REQUIRED_HEADERS = ['Id', 'Телефон', 'Дата'] as const

export interface TelegramDlImportRow {
  sourceRowIndex: number
  telegramId: string
  username: string | null
  phone: string | null
  firstName: string | null
  lastName: string | null
  description: string | null
  region: string | null
  date: string | null
  channels: string | null
  fullName: string | null
  address: string | null
  vkUrl: string | null
  email: string | null
  telegramContact: string | null
  instagram: string | null
  viber: string | null
  odnoklassniki: string | null
  birthDate: string | null
  usernameExtra: string | null
  geo: string | null
}

export interface TelegramDlImportParseResult {
  originalFileName: string
  replacementKey: string
  sheetName: string
  contacts: TelegramDlImportRow[]
}

export class TelegramDlImportParser {
  async parse(
    buffer: Buffer,
    originalFileName: string
  ): Promise<TelegramDlImportParseResult> {
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer)

    const worksheet = workbook.worksheets[0]
    if (!worksheet) {
      throw new Error('Excel file does not contain any worksheets')
    }

    const headers = this.readHeaders(this.toArrayValues(worksheet.getRow(1).values))
    const headerIndex = this.buildHeaderIndex(headers)
    const missingHeaders = REQUIRED_HEADERS.filter(
      (header) => !headerIndex.has(header)
    )

    if (missingHeaders.length > 0) {
      throw new Error(
        `Отсутствуют обязательные колонки: ${missingHeaders.join(', ')}`
      )
    }

    const contacts: TelegramDlImportRow[] = []
    for (let rowIndex = 2; rowIndex <= worksheet.rowCount; rowIndex += 1) {
      const row = worksheet.getRow(rowIndex)
      const values = this.toArrayValues(row.values)
      if (this.isEmptyRow(values)) {
        continue
      }

      contacts.push(this.mapRow(values, headers, row.number))
    }

    return {
      originalFileName: this.getReplacementKey(originalFileName),
      replacementKey: this.getReplacementKey(originalFileName),
      sheetName: worksheet.name,
      contacts,
    }
  }

  getReplacementKey(fileName: string): string {
    return path.basename(fileName).trim()
  }

  private readHeaders(values: unknown[]): string[] {
    const headers: string[] = []
    for (let index = 1; index < values.length; index += 1) {
      headers.push(this.normalizeHeader(values[index]))
    }
    return headers
  }

  private toArrayValues(values: ExcelJS.CellValue[] | { [key: string]: ExcelJS.CellValue }): unknown[] {
    return Array.isArray(values) ? values : Object.values(values)
  }

  private buildHeaderIndex(headers: string[]): Map<string, number[]> {
    const index = new Map<string, number[]>()
    headers.forEach((header, position) => {
      if (!header) {
        return
      }
      const positions = index.get(header) ?? []
      positions.push(position + 1)
      index.set(header, positions)
    })
    return index
  }

  private mapRow(
    values: unknown[],
    headers: string[],
    sourceRowIndex: number
  ): TelegramDlImportRow {
    const usernameIndexes = this.getHeaderPositions(headers, 'Username')
    const firstUsernameIndex = usernameIndexes[0] ?? null
    const secondUsernameIndex = usernameIndexes[1] ?? null

    const getCell = (columnIndex: number | null): string | null => {
      if (columnIndex === null) {
        return null
      }
      return this.normalizeCell(values[columnIndex])
    }

    return {
      sourceRowIndex,
      telegramId: getCell(this.getRequiredHeaderPosition(headers, 'Id')) ?? '',
      username: getCell(firstUsernameIndex),
      phone: getCell(this.getRequiredHeaderPosition(headers, 'Телефон')),
      firstName: getCell(this.getHeaderPosition(headers, 'Имя')),
      lastName: getCell(this.getHeaderPosition(headers, 'Фамилия')),
      description: getCell(this.getHeaderPosition(headers, 'Описание')),
      region: getCell(this.getHeaderPosition(headers, 'Регион')),
      date: getCell(this.getRequiredHeaderPosition(headers, 'Дата')),
      channels: getCell(this.getHeaderPosition(headers, 'Каналы')),
      fullName: getCell(this.getHeaderPosition(headers, 'ФИО')),
      address: getCell(this.getHeaderPosition(headers, 'Адрес')),
      vkUrl: getCell(this.getHeaderPosition(headers, 'Вконтакте')),
      email: getCell(this.getHeaderPosition(headers, 'Почта')),
      telegramContact: getCell(this.getHeaderPosition(headers, 'Телеграм')),
      instagram: getCell(this.getHeaderPosition(headers, 'Инстаграм')),
      viber: getCell(this.getHeaderPosition(headers, 'Viber')),
      odnoklassniki: getCell(this.getHeaderPosition(headers, 'Одноклассники')),
      birthDate: getCell(this.getHeaderPosition(headers, 'Дата рождения')),
      usernameExtra: getCell(secondUsernameIndex),
      geo: getCell(this.getHeaderPosition(headers, 'Гео')),
    }
  }

  private getHeaderPosition(
    headers: string[],
    headerName: string
  ): number | null {
    const position = headers.indexOf(headerName)
    return position >= 0 ? position + 1 : null
  }

  private getRequiredHeaderPosition(
    headers: string[],
    headerName: string
  ): number {
    const position = this.getHeaderPosition(headers, headerName)
    if (position === null) {
      throw new Error(`Отсутствуют обязательные колонки: ${headerName}`)
    }
    return position
  }

  private getHeaderPositions(headers: string[], headerName: string): number[] {
    const positions: number[] = []
    headers.forEach((header, index) => {
      if (header === headerName) {
        positions.push(index + 1)
      }
    })
    return positions
  }

  private normalizeHeader(value: unknown): string {
    return this.normalizeCell(value) ?? ''
  }

  private normalizeCell(value: unknown): string | null {
    if (value === null || value === undefined) {
      return null
    }

    if (typeof value === 'string') {
      const trimmed = value.trim()
      return trimmed.length > 0 ? trimmed : null
    }

    if (value instanceof Date) {
      return value.toISOString()
    }

    if (typeof value === 'number' || typeof value === 'bigint') {
      return String(value)
    }

    if (typeof value === 'boolean') {
      return value ? 'true' : 'false'
    }

    const stringValue = String(value).trim()
    return stringValue.length > 0 ? stringValue : null
  }

  private isEmptyRow(values: unknown[]): boolean {
    return values
      .slice(1)
      .every((value) => this.normalizeCell(value) === null)
  }
}
