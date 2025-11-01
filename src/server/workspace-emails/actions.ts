'use server'

import { cookies } from "next/headers"
import { z } from "zod"

import { buildGoogleAuthUrl, generateStateToken } from "@/lib/google"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export type WorkspaceEmailFormState = {
  success: boolean
  error?: string
  authUrl?: string
}

export type WorkspaceEmailDeleteState = {
  success: boolean
  error?: string
}

const createWorkspaceEmailSchema = z.object({
  email: z.string().email("Enter a valid Google Workspace email."),
  displayName: z.string().min(1, "Display name is required.")
})

export const createWorkspaceEmailAction = async (
  _prevState: WorkspaceEmailFormState,
  formData: FormData
): Promise<WorkspaceEmailFormState> => {
  const parsed = createWorkspaceEmailSchema.safeParse({
    email: formData.get("email"),
    displayName: formData.get("displayName")
  })

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid form submission."
    }
  }

  const { email, displayName } = parsed.data

  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      success: false,
      error: "You need to be signed in to add workspace emails."
    }
  }

  const supabaseAdmin = getSupabaseAdminClient()

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  if (profileError || !profile || profile.role !== "admin") {
    return {
      success: false,
      error: "Only admin users can add workspace emails."
    }
  }

  const cookieStore = await cookies()
  const stateToken = generateStateToken()

  const pendingPayload = {
    state: stateToken,
    email,
    displayName,
    userId: user.id
  }

  cookieStore.set({
    name: "workspace_oauth_state",
    value: JSON.stringify(pendingPayload),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60
  })

  return {
    success: true,
    authUrl: buildGoogleAuthUrl(stateToken, email)
  }
}

const deleteWorkspaceEmailSchema = z.object({
  workspaceEmailId: z.string().uuid("Invalid workspace email id.")
})

export const deleteWorkspaceEmailAction = async (
  _prev: WorkspaceEmailDeleteState,
  formData: FormData
): Promise<WorkspaceEmailDeleteState> => {
  const parsed = deleteWorkspaceEmailSchema.safeParse({
    workspaceEmailId: formData.get("workspaceEmailId")
  })

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid request."
    }
  }

  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      success: false,
      error: "You must be signed in."
    }
  }

  const supabaseAdmin = getSupabaseAdminClient()

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  if (profile?.role !== "admin") {
    return {
      success: false,
      error: "Only administrators can delete workspace emails."
    }
  }

  const { data: assignments } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("workspace_email_id", parsed.data.workspaceEmailId)
    .limit(1)

  if (assignments && assignments.length > 0) {
    return {
      success: false,
      error:
        "This mailbox is currently assigned to a team member. Unassign it first."
    }
  }

  const { error } = await supabaseAdmin
    .from("workspace_emails")
    .delete()
    .eq("id", parsed.data.workspaceEmailId)

  if (error) {
    console.error("[workspace-email] delete failed", error)
    return {
      success: false,
      error: "Unable to delete workspace email. Try again later."
    }
  }

  return { success: true }
}
