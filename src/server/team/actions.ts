'use server'

import { z } from "zod"

import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import { getSupabaseServerClient } from "@/lib/supabase/server"

const ensureAdmin = async () => {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("You must be signed in.")
  }

  const supabaseAdmin = getSupabaseAdminClient()
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  if (profile?.role !== "admin") {
    throw new Error("Only administrators can perform this action.")
  }

  return {
    supabaseAdmin,
    userId: user.id
  }
}

export type InviteTeamMemberState = {
  success: boolean
  error?: string
}

const inviteSchema = z.object({
  email: z.string().email("Enter a valid email address.")
})

export const inviteTeamMemberAction = async (
  _prev: InviteTeamMemberState,
  formData: FormData
): Promise<InviteTeamMemberState> => {
  const parsed = inviteSchema.safeParse({
    email: formData.get("email")
  })

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid email."
    }
  }

  try {
    const { supabaseAdmin } = await ensureAdmin()
    const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      parsed.data.email,
      {
        data: { role: "team" }
      }
    )

    if (error) {
      throw error
    }

    return { success: true }
  } catch (error) {
    console.error("[team] invite failed", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to invite user. Try again later."
    }
  }
}

export type TeamAssignmentState = {
  success: boolean
  error?: string
}

const assignmentSchema = z.object({
  profileId: z.string().uuid("Invalid team member."),
  workspaceEmailId: z.union([
    z.string().uuid(),
    z.literal("unassign")
  ])
})

export const updateTeamAssignmentAction = async (
  _prev: TeamAssignmentState,
  formData: FormData
): Promise<TeamAssignmentState> => {
  const parsed = assignmentSchema.safeParse({
    profileId: formData.get("profileId"),
    workspaceEmailId: formData.get("workspaceEmailId")
  })

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid assignment."
    }
  }

  try {
    const { supabaseAdmin } = await ensureAdmin()
    const workspaceEmailId =
      parsed.data.workspaceEmailId === "unassign"
        ? null
        : parsed.data.workspaceEmailId

    const { error: updateProfileError } = await supabaseAdmin
      .from("profiles")
      .update({
        workspace_email_id: workspaceEmailId
      })
      .eq("id", parsed.data.profileId)

    if (updateProfileError) {
      throw updateProfileError
    }

    if (workspaceEmailId) {
      await supabaseAdmin
        .from("team_assignments")
        .upsert({
          profile_id: parsed.data.profileId,
          workspace_email_id: workspaceEmailId
        })
    } else {
      await supabaseAdmin
        .from("team_assignments")
        .delete()
        .eq("profile_id", parsed.data.profileId)
    }

    return { success: true }
  } catch (error) {
    console.error("[team] assignment update failed", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to update assignment."
    }
  }
}

export type RemoveTeamMemberState = {
  success: boolean
  error?: string
}

const removeSchema = z.object({
  profileId: z.string().uuid(),
  authUserId: z.string().uuid()
})

export const removeTeamMemberAction = async (
  _prev: RemoveTeamMemberState,
  formData: FormData
): Promise<RemoveTeamMemberState> => {
  const parsed = removeSchema.safeParse({
    profileId: formData.get("profileId"),
    authUserId: formData.get("authUserId")
  })

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid request."
    }
  }

  try {
    const { supabaseAdmin, userId } = await ensureAdmin()

    if (parsed.data.authUserId === userId) {
      return {
        success: false,
        error: "You cannot remove your own account."
      }
    }

    await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", parsed.data.profileId)

    await supabaseAdmin
      .from("team_assignments")
      .delete()
      .eq("profile_id", parsed.data.profileId)

    const { error } = await supabaseAdmin.auth.admin.deleteUser(
      parsed.data.authUserId
    )

    if (error) {
      throw error
    }

    return { success: true }
  } catch (error) {
    console.error("[team] remove member failed", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to remove team member. Try again later."
    }
  }
}

