"use server";

import { z } from "zod";

import { env } from "@/lib/env";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const ensureAdmin = async () => {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("You must be signed in.");
  }

  const supabaseAdmin = getSupabaseAdminClient();
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    throw new Error("Only administrators can perform this action.");
  }

  return {
    supabaseAdmin,
    userId: user.id
  };
};

export type InviteTeamMemberState = {
  success: boolean;
  error?: string;
};

const inviteSchema = z.object({
  email: z
    .string()
    .email("Enter a valid email address.")
    .transform((value) => value.trim().toLowerCase())
});

export type CreateTeamMemberState = {
  success: boolean;
  error?: string;
};

const createTeamMemberSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Enter the team member's full name.")
    .max(120, "Full name must be 120 characters or fewer."),
  email: z
    .string()
    .email("Enter a valid email address.")
    .transform((value) => value.trim().toLowerCase()),
  password: z.string().min(8, "Password must be at least 8 characters.")
});

export const inviteTeamMemberAction = async (
  _prev: InviteTeamMemberState,
  formData: FormData
): Promise<InviteTeamMemberState> => {
  const parsed = inviteSchema.safeParse({
    email: formData.get("email")
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid email."
    };
  }

  try {
    const { supabaseAdmin } = await ensureAdmin();

    const { data: existingAuthUser } = await supabaseAdmin
      .from("auth.users")
      .select("id")
      .eq("email", parsed.data.email)
      .maybeSingle();

    if (existingAuthUser) {
      return {
        success: false,
        error: "This email is already registered or has a pending invite."
      };
    }

    const redirectTo = `${env.NEXT_PUBLIC_APP_URL}/auth/login`;

    const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      parsed.data.email,
      {
        data: { role: "team" },
        redirectTo
      }
    );

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error("[team] invite failed", error);

    const authErrorMessage =
      error instanceof Error
        ? error.message
        : "Unable to invite user. Try again later.";

    const friendlyMessage =
      authErrorMessage === "Database error saving new user"
        ? "Unable to create invite in Supabase auth. Check if the email is already in use or inspect Supabase logs for details."
        : authErrorMessage;

    return {
      success: false,
      error: friendlyMessage
    };
  }
};

export const createTeamMemberAction = async (
  _prev: CreateTeamMemberState,
  formData: FormData
): Promise<CreateTeamMemberState> => {
  const parsed = createTeamMemberSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password")
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      success: false,
      error: issue?.message ?? "Invalid form submission."
    };
  }

  const { email, password, fullName } = parsed.data;

  try {
    const { supabaseAdmin } = await ensureAdmin();

    const { data: existingAuthUser } = await supabaseAdmin
      .from("auth.users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingAuthUser) {
      return {
        success: false,
        error:
          "This email is already registered. Use a different email or reset the password."
      };
    }

    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingProfile) {
      return {
        success: false,
        error:
          "A profile with this email already exists. Remove it first or choose a different email."
      };
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (error) {
      throw error;
    }

    const userId = data.user?.id;

    if (!userId) {
      throw new Error("Supabase did not return the created user id.");
    }

    const { error: upsertError } = await supabaseAdmin.from("profiles").upsert(
      {
        id: userId,
        email,
        role: "team",
        full_name: fullName
      },
      {
        onConflict: "id"
      }
    );

    if (upsertError) {
      throw upsertError;
    }

    return { success: true };
  } catch (error) {
    console.error("[team] create member failed", error);

    const message = (() => {
      if (error instanceof Error) {
        if ("status" in error && (error as any).status === 500) {
          return "Supabase rejected the new user. Check for existing records with the same email in auth or profiles.";
        }
        return error.message;
      }
      return "Unable to create user.";
    })();

    return {
      success: false,
      error: message
    };
  }
};

export type TeamAssignmentState = {
  success: boolean;
  error?: string;
};

const assignmentSchema = z.object({
  profileId: z.string().uuid("Invalid team member."),
  workspaceEmailId: z.union([z.string().uuid(), z.literal("unassign")])
});

export const updateTeamAssignmentAction = async (
  _prev: TeamAssignmentState,
  formData: FormData
): Promise<TeamAssignmentState> => {
  const parsed = assignmentSchema.safeParse({
    profileId: formData.get("profileId"),
    workspaceEmailId: formData.get("workspaceEmailId")
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid assignment."
    };
  }

  try {
    const { supabaseAdmin } = await ensureAdmin();
    const workspaceEmailId =
      parsed.data.workspaceEmailId === "unassign"
        ? null
        : parsed.data.workspaceEmailId;

    const { error: updateProfileError } = await supabaseAdmin
      .from("profiles")
      .update({
        workspace_email_id: workspaceEmailId
      })
      .eq("id", parsed.data.profileId);

    if (updateProfileError) {
      throw updateProfileError;
    }

    if (workspaceEmailId) {
      await supabaseAdmin.from("team_assignments").upsert({
        profile_id: parsed.data.profileId,
        workspace_email_id: workspaceEmailId
      });
    } else {
      await supabaseAdmin
        .from("team_assignments")
        .delete()
        .eq("profile_id", parsed.data.profileId);
    }

    return { success: true };
  } catch (error) {
    console.error("[team] assignment update failed", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unable to update assignment."
    };
  }
};

export type RemoveTeamMemberState = {
  success: boolean;
  error?: string;
};

const removeSchema = z.object({
  profileId: z.string().uuid(),
  authUserId: z.string().uuid()
});

export const removeTeamMemberAction = async (
  _prev: RemoveTeamMemberState,
  formData: FormData
): Promise<RemoveTeamMemberState> => {
  const parsed = removeSchema.safeParse({
    profileId: formData.get("profileId"),
    authUserId: formData.get("authUserId")
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid request."
    };
  }

  try {
    const { supabaseAdmin, userId } = await ensureAdmin();

    if (parsed.data.authUserId === userId) {
      return {
        success: false,
        error: "You cannot remove your own account."
      };
    }

    await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", parsed.data.profileId);

    await supabaseAdmin
      .from("team_assignments")
      .delete()
      .eq("profile_id", parsed.data.profileId);

    const { error } = await supabaseAdmin.auth.admin.deleteUser(
      parsed.data.authUserId
    );

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error("[team] remove member failed", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to remove team member. Try again later."
    };
  }
};
