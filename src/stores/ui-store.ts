'use client'

import { create } from "zustand"

type ModalState = {
  isEmailComposerOpen: boolean
  activeLeadId: string | null
}

type ModalActions = {
  openEmailComposer: (leadId: string) => void
  closeEmailComposer: () => void
}

const initialState: ModalState = {
  isEmailComposerOpen: false,
  activeLeadId: null
}

export const useUiStore = create<ModalState & ModalActions>((set) => ({
  ...initialState,
  openEmailComposer: (leadId: string) =>
    set({
      isEmailComposerOpen: true,
      activeLeadId: leadId
    }),
  closeEmailComposer: () => set(initialState)
}))

