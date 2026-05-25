import { create } from 'zustand'
import type { NavigationState } from '@/types/common'

export const useNavigationStore = create<NavigationState>((set) => ({
  currentPage: 'tasks',
  setCurrentPage: (page) => set({ currentPage: page }),
}))
