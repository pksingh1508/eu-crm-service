import { redirect } from "next/navigation"

import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import { getSupabaseServerClient } from "@/lib/supabase/server"

const TeamLayout = async ({ children }: { children: React.ReactNode }) => {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  if (userError) {
    console.error("[team-layout] failed to verify auth user", userError)
  }

  if (!user) {
    redirect("/login")
  }

  const supabaseAdmin = getSupabaseAdminClient()
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  if (!profile || profile.role !== "team") {
    redirect("/admin")
  }

  return <>{children}</>
}

export default TeamLayout
