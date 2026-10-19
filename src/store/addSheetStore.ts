import { create } from 'zustand'

interface AddSheetState {
  isOpen:            boolean
  toast:             string | null
  pendingAction:     string | null
  open:              () => void
  close:             () => void
  showToast:         (msg: string) => void
  clearToast:        () => void
  setPendingAction:  (action: string) => void
  clearPendingAction: () => void
}

export const useAddSheetStore = create<AddSheetState>((set) => ({
  isOpen:         false,
  toast:          null,
  pendingAction:  null,

  open:               () => set({ isOpen: true }),
  close:              () => set({ isOpen: false }),
  showToast:          (msg) => set({ toast: msg }),
  clearToast:         () => set({ toast: null }),
  setPendingAction:   (action) => set({ pendingAction: action }),
  clearPendingAction: () => set({ pendingAction: null }),
}))