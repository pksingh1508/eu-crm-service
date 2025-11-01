'use server'

import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

import { env } from "../env"

export const getSupabaseServerClient = async () => {
  const cookieStore = await cookies()

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...(options ?? {}) })
          } catch (error) {
            if (process.env.NODE_ENV !== "production") {
              console.warn(
                "[supabase] unable to set cookie in this context. Ignoring.",
                error
              )
            }
          }
        },
        remove(name: string, options: any) {
          try {
            if (options) {
              cookieStore.delete({ name, ...options })
            } else {
              cookieStore.delete(name)
            }
          } catch (error) {
            if (process.env.NODE_ENV !== "production") {
              console.warn(
                "[supabase] unable to remove cookie in this context. Ignoring.",
                error
              )
            }
          }
        }
      }
    }
  )
}
