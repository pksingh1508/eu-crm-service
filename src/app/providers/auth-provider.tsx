"use client"

import { PropsWithChildren, useEffect } from "react"

import { useAuthStore, type UserRole } from "@/stores/auth-store"

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
  const setAuthState = useAuthStore((state) => state.setAuthState)

  useEffect(() => {
    setAuthState({
      user: initialUser,
      role: initialRole,
      workspaceEmailId: initialWorkspaceEmailId
    })
  }, [initialUser, initialRole, initialWorkspaceEmailId, setAuthState])

  return <>{children}</>
}

export default AuthProvider

