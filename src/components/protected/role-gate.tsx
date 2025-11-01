"use client"

import { useMemo } from "react"

import { useAuthStore, type UserRole } from "@/stores/auth-store"

type RoleGateProps = {
  allow: UserRole | UserRole[]
  fallback?: React.ReactNode
  children: React.ReactNode
}

const RoleGate = ({ allow, fallback = null, children }: RoleGateProps) => {
  const role = useAuthStore((state) => state.role)
  const isInitialized = useAuthStore((state) => state.isInitialized)

  const allowedRoles = useMemo(
    () => (Array.isArray(allow) ? allow : [allow]),
    [allow]
  )

  if (!isInitialized) {
    return null
  }

  if (!role || !allowedRoles.includes(role)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

export default RoleGate

