import type { Metadata } from "next"
import { Inter } from "next/font/google"

import AuthProvider from "./providers/auth-provider"
import "./globals.css"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CRM System - Professional Lead Management",
  description:
    "A professional CRM system for managing leads and team collaboration"
}

const RootLayout = async ({
  children
}: Readonly<{
  children: React.ReactNode
}>) => {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  let initialRole: "admin" | "team" | null = null
  let workspaceEmailId: string | null = null

  if (userError) {
    console.error("[layout] failed to verify auth user", userError)
  }

  if (user) {
    try {
      const supabaseAdmin = getSupabaseAdminClient()
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("role, workspace_email_id")
        .eq("id", user.id)
        .maybeSingle()

      initialRole = (profile?.role as "admin" | "team" | null) ?? null
      workspaceEmailId = profile?.workspace_email_id ?? null
    } catch (error) {
      console.error("[layout] failed to fetch profile role", error)
    }
  }

  const initialUser = user
    ? { id: user.id, email: user.email ?? null }
    : null

  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider
          initialUser={initialUser}
          initialRole={initialRole}
          initialWorkspaceEmailId={workspaceEmailId}
        >
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}

export default RootLayout
