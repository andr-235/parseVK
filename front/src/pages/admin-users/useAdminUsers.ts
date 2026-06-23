import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchAdminUsers, type SortDirection, type UserRole, type UserSortKey } from '../../shared/api/admin-users'
import { useDebounce } from '../../shared/hooks/useDebounce'

export type RoleFilter = 'all' | UserRole
export type ActiveFilter = 'all' | 'active' | 'inactive'
export type PasswordFilter = 'all' | 'temporary' | 'permanent'

export function useAdminUsers() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [search, setSearchValue] = useState('')
  const [role, setRoleValue] = useState<RoleFilter>('all')
  const [active, setActiveValue] = useState<ActiveFilter>('all')
  const [password, setPasswordValue] = useState<PasswordFilter>('all')
  const [sortBy, setSortBy] = useState<UserSortKey>('createdAt')
  const [sortDir, setSortDir] = useState<SortDirection>('desc')
  const debouncedSearch = useDebounce(search.trim(), 300)

  const query = useMemo(() => ({
    page,
    pageSize,
    search: debouncedSearch || undefined,
    role: role === 'all' ? undefined : role,
    isActive: active === 'all' ? undefined : active === 'active',
    isTemporaryPassword: password === 'all' ? undefined : password === 'temporary',
    sortBy,
    sortDir,
  }), [page, pageSize, debouncedSearch, role, active, password, sortBy, sortDir])

  const result = useQuery({
    queryKey: ['admin-users', query],
    queryFn: () => fetchAdminUsers(query),
    placeholderData: (previous) => previous,
  })

  const resetPage = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value)
    setPage(1)
  }

  const changeSort = (key: string) => {
    const typedKey = key as UserSortKey
    if (typedKey === sortBy) setSortDir((value) => value === 'asc' ? 'desc' : 'asc')
    else {
      setSortBy(typedKey)
      setSortDir('asc')
    }
    setPage(1)
  }

  const resetFilters = () => {
    setSearchValue('')
    setRoleValue('all')
    setActiveValue('all')
    setPasswordValue('all')
    setPage(1)
  }

  return {
    ...result, page, pageSize, search, role, active, password, sortBy, sortDir,
    setPage, setPageSize: resetPage(setPageSize), setSearch: resetPage(setSearchValue),
    setRole: resetPage(setRoleValue), setActive: resetPage(setActiveValue),
    setPassword: resetPage(setPasswordValue), changeSort, resetFilters,
  }
}
