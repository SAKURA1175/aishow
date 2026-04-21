import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { listSessions } from '@/api/chat'

const useStore = create(
  persist(
    (set) => ({
      user: null,
      theme: 'light',
      sessions: [],
      currentSessionId: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null, sessions: [], currentSessionId: null }),
      setSessions: (sessions) => set({ sessions }),
      setCurrentSessionId: (currentSessionId) => set({ currentSessionId }),
      loadSessions: async () => {
        try {
          const res = await listSessions()
          if (res.data?.success) {
            set({ sessions: res.data.data || [] })
          }
        } catch (_) {}
      },
      setTheme: (theme) => {
        set({ theme })
        if (theme === 'dark') {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      },
      toggleTheme: () => {
        const state = useStore.getState()
        const next = state.theme === 'dark' ? 'light' : 'dark'
        state.setTheme(next)
      },
    }),
    {
      name: 'aishow-storage',
      partialize: (state) => ({ user: state.user, theme: state.theme }),
      onRehydrateStorage: () => (state) => {
        if (state?.theme === 'dark') {
          document.documentElement.classList.add('dark')
        }
      },
    }
  )
)

export default useStore
