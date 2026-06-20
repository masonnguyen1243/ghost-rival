import { create } from 'zustand'

type SyncStatus = 'idle' | 'syncing' | 'error' | 'success'

interface SyncStore {
  syncStatus: SyncStatus
  lastSyncedAt: number | null
  isConnected: boolean
  setSyncStatus: (status: SyncStatus) => void
  setLastSyncedAt: (timestamp: number | null) => void
  setIsConnected: (connected: boolean) => void
}

export const useSyncStore = create<SyncStore>((set) => ({
  syncStatus: 'idle',
  lastSyncedAt: null,
  isConnected: false,
  setSyncStatus: (status) => set({ syncStatus: status }),
  setLastSyncedAt: (timestamp) => set({ lastSyncedAt: timestamp }),
  setIsConnected: (connected) => set({ isConnected: connected }),
}))
