import { FriendsExportPage, type PlatformExportConfig } from '../friends-export/FriendsExportPage'
import { startOkFriendsExport, downloadOkFriendsXlsx, getOkFriendsStreamUrl, type StartOkFriendsExportParams } from '../../shared/api/ok-friends'
import { OkExportForm } from './components/OkExportForm'

const okConfig: PlatformExportConfig<StartOkFriendsExportParams> = {
  title: 'Экспорт друзей OK',
  description: 'Выгрузка списка друзей пользователя OK в XLSX.',
  FormComponent: OkExportForm,
  startExport: startOkFriendsExport,
  downloadXlsx: downloadOkFriendsXlsx,
  getStreamUrl: getOkFriendsStreamUrl,
  platform: 'ok',
  downloadFileName: 'ok_friends_export',
}

export function OkFriendsExportPage() {
  return <FriendsExportPage config={okConfig} />
}
