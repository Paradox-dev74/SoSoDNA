import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserResponse } from '@/lib/api/auth'
import type { SyncSummary } from '@/lib/sync-status'

interface AppState {
  user: UserResponse | null
  isAuthenticated: boolean
  sidebarCollapsed: boolean
  aiPanelOpen: boolean
  selectedSymbol: string
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error'
  syncMessage: string | null
  lastSyncSummary: SyncSummary | null
  setUser: (user: UserResponse | null) => void
  setAuthenticated: (value: boolean) => void
  toggleSidebar: () => void
  toggleAiPanel: () => void
  setSelectedSymbol: (symbol: string) => void
  setSyncStatus: (status: AppState['syncStatus'], message?: string | null) => void
  setLastSyncSummary: (summary: SyncSummary | null) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      sidebarCollapsed: false,
      aiPanelOpen: true,
      selectedSymbol: 'BTC-USD',
      syncStatus: 'idle',
      syncMessage: null,
      lastSyncSummary: null,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setAuthenticated: (value) => set({ isAuthenticated: value }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      toggleAiPanel: () => set((s) => ({ aiPanelOpen: !s.aiPanelOpen })),
      setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol }),
      setSyncStatus: (syncStatus, syncMessage = null) => set({ syncStatus, syncMessage }),
      setLastSyncSummary: (lastSyncSummary) => set({ lastSyncSummary }),
    }),
    {
      name: 'soso-dna-app',
      partialize: (s) => ({
        sidebarCollapsed: s.sidebarCollapsed,
        aiPanelOpen: s.aiPanelOpen,
        lastSyncSummary: s.lastSyncSummary,
      }),
    },
  ),
)
