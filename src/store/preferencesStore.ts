import { create } from 'zustand'

interface PreferencesState {
  weekStartDay: number  // 0 = Sunday, 1 = Monday
  setWeekStartDay: (day: number) => void
}

export const usePreferencesStore = create<PreferencesState>(set => ({
  weekStartDay: 1, // Monday default
  setWeekStartDay: (day) => set({ weekStartDay: day }),
}))