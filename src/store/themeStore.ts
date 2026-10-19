import { create } from 'zustand'

interface ThemeState {
  isDark:     boolean
  toggleDark: () => void
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDark: localStorage.getItem('theme') === 'dark',

  toggleDark: () => {
    const next = !get().isDark
    localStorage.setItem('theme', next ? 'dark' : 'light')

    // Tailwind v4 dark mode via data attribute
    document.documentElement.setAttribute(
      'data-theme',
      next ? 'dark' : 'light'
    )

    set({ isDark: next })
  },
}))