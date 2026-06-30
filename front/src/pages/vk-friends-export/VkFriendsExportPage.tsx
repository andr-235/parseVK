import { FriendsExportPage, type PlatformExportConfig } from '../friends-export/FriendsExportPage'
import { startVkFriendsExport, downloadVkFriendsXlsx, getVkFriendsStreamUrl, type StartVkFriendsExportParams } from '../../shared/api/vk-friends'
import { VkExportForm } from './components/VkExportForm'

const vkConfig: PlatformExportConfig<StartVkFriendsExportParams> = {
  title: 'Экспорт друзей VK',
  description: 'Выгрузка списка друзей пользователя VK в XLSX.',
  FormComponent: VkExportForm,
  startExport: startVkFriendsExport,
  downloadXlsx: downloadVkFriendsXlsx,
  getStreamUrl: getVkFriendsStreamUrl,
  platform: 'vk',
  downloadFileName: 'vk_friends_export',
}

export function VkFriendsExportPage() {
  return <FriendsExportPage config={vkConfig} />
}
