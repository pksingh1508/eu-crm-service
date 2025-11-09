import { NextResponse } from "next/server";
import { z } from "zod";

import { env } from "@/lib/env";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const AUTH_HEADER = "x-api-key";

const leadStatus = z.enum([
  "new",
  "contacted",
  "qualified",
  "proposal",
  "negotiation",
  "won",
  "lost"
]);

const leadInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Lead name is required.")
    .max(255, "Lead name must be under 255 characters."),
  email: z
    .string()
    .trim()
    .email("Invalid email address.")
    .max(320, "Email must be under 320 characters.")
    .optional(),
  company: z
    .string()
    .trim()
    .max(255, "Company name must be under 255 characters.")
    .optional(),
  phone: z
    .string()
    .trim()
    .max(50, "Phone must be under 50 characters.")
    .optional(),
  notes: z.string().optional(),
  message: z.string().optional(),
  status: leadStatus.optional(),
  source: z.record(z.string(), z.unknown()).optional(),
  assignedTo: z.string().uuid().optional()
});

const parseJson = async (request: Request) => {
  try {
    return await request.json();
  } catch (error) {
    throw new Error("Invalid JSON payload.");
  }
};

const unauthorizedResponse = (message = "Unauthorized") =>
  NextResponse.json({ message }, { status: 401 });

const badRequestResponse = (message: string, issues?: unknown) =>
  NextResponse.json({ message, issues }, { status: 400 });

const serverErrorResponse = () =>
  NextResponse.json(
    { message: "Unable to ingest lead at this time." },
    { status: 500 }
  );

export const POST = async (request: Request) => {
  const apiKey =
    request.headers.get(AUTH_HEADER) ?? request.headers.get("authorization");
  const expectedKey = env.LEAD_INGESTION_API_KEY;

  if (!apiKey) {
    return unauthorizedResponse("Missing API key.");
  }

  const normalizedApiKey = apiKey.startsWith("Bearer ")
    ? apiKey.replace("Bearer ", "")
    : apiKey;

  if (normalizedApiKey !== expectedKey) {
    return unauthorizedResponse();
  }

  let rawPayload: unknown;

  try {
    rawPayload = await parseJson(request);
  } catch (error) {
    return badRequestResponse((error as Error).message);
  }

  const parsed = leadInputSchema.safeParse(rawPayload);

  if (!parsed.success) {
    return badRequestResponse(
      "Invalid lead payload.",
      parsed.error.flatten().fieldErrors
    );
  }

  const payload = parsed.data;
  const supabase = getSupabaseAdminClient();

  let existingLeadId: string | null = null;

  if (payload.email) {
    const { data: existingLead, error: lookupError } = await supabase
      .from("leads")
      .select("id")
      .eq("email", payload.email)
      .maybeSingle();

    if (lookupError) {
      console.error("[lead-ingestion] lookup failed", lookupError);
      return serverErrorResponse();
    }

    existingLeadId = existingLead?.id ?? null;
  }

  const upsertPayload = {
    ...(existingLeadId ? { id: existingLeadId } : {}),
    name: payload.name,
    email: payload.email ?? null,
    company: payload.company ?? null,
    phone: payload.phone ?? null,
    notes: payload.notes ?? null,
    message: payload.message ?? null,
    status: payload.status ?? undefined,
    source: payload.source ?? null,
    assigned_to: payload.assignedTo ?? null
  };

  const { data: upsertedLead, error: upsertError } = await supabase
    .from("leads")
    .upsert(upsertPayload)
    .select()
    .maybeSingle();

  if (upsertError || !upsertedLead) {
    console.error("[lead-ingestion] upsert failed", upsertError);
    return serverErrorResponse();
  }

  // const eventPayload = {
  //   ingestedAt: new Date().toISOString(),
  //   source: payload.source ?? null,
  //   origin: "api.leads",
  //   request: {
  //     name: payload.name,
  //     email: payload.email ?? null,
  //     company: payload.company ?? null,
  //     phone: payload.phone ?? null,
  //     notes: payload.notes ?? null,
  //     status: payload.status ?? null,
  //     assignedTo: payload.assignedTo ?? null
  //   }
  // };

  // const { error: eventError } = await supabase.from("lead_events").insert({
  //   lead_id: upsertedLead.id,
  //   actor_id: null,
  //   workspace_email_id: null,
  //   event_type: eventType,
  //   payload: eventPayload
  // });

  // if (eventError) {
  //   console.error("[lead-ingestion] event insert failed", eventError);
  // }

  const eventType = "created";
  const responseBody = {
    lead: upsertedLead,
    status: eventType
  };

  return NextResponse.json(responseBody, {
    status: existingLeadId ? 200 : 201
  });
};
