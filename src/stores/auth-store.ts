'use client'

import { createContext, useContext } from "react"
import { createStore, useStore } from "zustand"

type UserInfo = {
  id: string
  email: string | null
}

export type UserRole = "admin" | "team" | null

type AuthData = {
  user: UserInfo | null
  role: UserRole
  workspaceEmailId: string | null
}

type AuthState = AuthData & {
  isInitialized: boolean
  isAuthenticated: boolean
}

type AuthActions = {
  setAuthState: (payload: AuthData) => void
  clear: () => void
}

type AuthStore = AuthState & AuthActions

const toAuthState = (data: AuthData): AuthState => ({
  ...data,
  isInitialized: true,
  isAuthenticated: Boolean(data.user)
})

// Created per request (see AuthProvider) from the session the server already
// knows, so the first render shows the signed-in user instead of a placeholder.
export const createAuthStore = (initialData: AuthData) =>
  createStore<AuthStore>()((set) => ({
    ...toAuthState(initialData),
    setAuthState: (data) => set(toAuthState(data)),
    clear: () =>
      set(toAuthState({ user: null, role: null, workspaceEmailId: null }))
  }))

export const AuthStoreContext = createContext<ReturnType<
  typeof createAuthStore
> | null>(null)

export const useAuthStore = <T,>(selector: (state: AuthStore) => T) => {
  const store = useContext(AuthStoreContext)

  if (!store) {
    throw new Error("useAuthStore must be used within AuthProvider")
  }

  return useStore(store, selector)
}
