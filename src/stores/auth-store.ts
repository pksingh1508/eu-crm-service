'use client'

import { create } from "zustand"

type UserInfo = {
  id: string
  email: string | null
}

export type UserRole = "admin" | "team" | null

type AuthState = {
  user: UserInfo | null
  role: UserRole
  workspaceEmailId: string | null
  isInitialized: boolean
  isAuthenticated: boolean
}

type AuthActions = {
  setAuthState: (payload: {
    user: UserInfo | null
    role: UserRole
    workspaceEmailId: string | null
  }) => void
  clear: () => void
}

const initialState: AuthState = {
  user: null,
  role: null,
  workspaceEmailId: null,
  isInitialized: false,
  isAuthenticated: false
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  ...initialState,
  setAuthState: ({ user, role, workspaceEmailId }) =>
    set({
      user,
      role,
      workspaceEmailId,
      isInitialized: true,
      isAuthenticated: Boolean(user)
    }),
  clear: () => set({ ...initialState, isInitialized: true })
}))

