import { createApiClient } from './client/httpClient'
import { defaultAuthProvider } from './client/authProvider'
import { GATEWAY_API_URL } from './config'

export { createApiClient } from './client/httpClient'
export type { ApiClient } from './client/httpClient'
export { ApiError, NetworkError } from './client/errors'
export { GATEWAY_API_URL, API_URL } from './config'
export { queryClient, getQueryPersister } from './query'

export const apiClient = createApiClient(GATEWAY_API_URL, defaultAuthProvider)


