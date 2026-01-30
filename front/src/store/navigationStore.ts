import { create } from 'zustand'
import type { NavigationState } from '@/shared/types'

export const useNavigationStore = create<NavigationState>((set) => ({
  currentPage: 'tasks',
  setCurrentPage: (page) => set({ currentPage: page }),
}))
