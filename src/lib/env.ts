import { z } from "zod"

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().min(1, "Missing NEXT_PUBLIC_SUPABASE_URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "Missing SUPABASE_SERVICE_ROLE_KEY"),
  RESEND_API_KEY: z.string().min(1, "Missing RESEND_API_KEY"),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .default("http://localhost:3000"),
  GOOGLE_OAUTH_CLIENT_ID: z
    .string()
    .min(1, "Missing GOOGLE_OAUTH_CLIENT_ID"),
  GOOGLE_OAUTH_CLIENT_SECRET: z
    .string()
    .min(1, "Missing GOOGLE_OAUTH_CLIENT_SECRET"),
  GOOGLE_OAUTH_REDIRECT_URI: z
    .string()
    .min(1, "Missing GOOGLE_OAUTH_REDIRECT_URI"),
  LEAD_INGESTION_API_KEY: z
    .string()
    .min(1, "Missing LEAD_INGESTION_API_KEY")
})

const trim = (v?: string) => (typeof v === "string" ? v.trim() : v)

export const env = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: trim(process.env.NEXT_PUBLIC_SUPABASE_URL),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: trim(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  SUPABASE_SERVICE_ROLE_KEY: trim(process.env.SUPABASE_SERVICE_ROLE_KEY),
  RESEND_API_KEY: trim(process.env.RESEND_API_KEY),
  NEXT_PUBLIC_APP_URL: trim(process.env.NEXT_PUBLIC_APP_URL),
  GOOGLE_OAUTH_CLIENT_ID: trim(process.env.GOOGLE_OAUTH_CLIENT_ID),
  GOOGLE_OAUTH_CLIENT_SECRET: trim(process.env.GOOGLE_OAUTH_CLIENT_SECRET),
  GOOGLE_OAUTH_REDIRECT_URI: trim(process.env.GOOGLE_OAUTH_REDIRECT_URI),
  LEAD_INGESTION_API_KEY: trim(process.env.LEAD_INGESTION_API_KEY)
})
