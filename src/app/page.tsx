'use client'

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { useAuthStore } from "@/stores/auth-store"

const Home = () => {
  const router = useRouter()
  const role = useAuthStore((state) => state.role)
  const isInitialized = useAuthStore((state) => state.isInitialized)

  useEffect(() => {
    if (!isInitialized) {
      return
    }

    if (role === "admin") {
      router.replace("/admin")
    } else if (role === "team") {
      router.replace("/team")
    } else {
      router.replace("/login")
    }
  }, [isInitialized, role, router])

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center text-sm text-slate-500">
        Preparing your workspace…
      </div>
    </main>
  )
}

export default Home
