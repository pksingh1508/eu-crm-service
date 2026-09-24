"use client"

import { PropsWithChildren, useEffect, useState } from "react"

import {
  AuthStoreContext,
  createAuthStore,
  type UserRole
} from "@/stores/auth-store"

type AuthProviderProps = PropsWithChildren<{
  initialUser: { id: string; email: string | null } | null
  initialRole: UserRole
  initialWorkspaceEmailId: string | null
}>

const AuthProvider = ({
  initialUser,
  initialRole,
  initialWorkspaceEmailId,
  children
}: AuthProviderProps) => {
  const [store] = useState(() =>
    createAuthStore({
      user: initialUser,
      role: initialRole,
      workspaceEmailId: initialWorkspaceEmailId
    })
  )

  // Picks up a new session from the server, e.g. after signing in or out
  useEffect(() => {
    store.getState().setAuthState({
      user: initialUser,
      role: initialRole,
      workspaceEmailId: initialWorkspaceEmailId
    })
  }, [initialUser, initialRole, initialWorkspaceEmailId, store])

  return <AuthStoreContext value={store}>{children}</AuthStoreContext>
}

export default AuthProvider
