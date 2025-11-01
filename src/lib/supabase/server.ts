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
            if (
              error instanceof Error &&
              error.message.includes("Cookies can only be modified")
            ) {
              if (process.env.NODE_ENV !== "production") {
                console.debug(
                  "[supabase] cookie write skipped outside of a server action or route handler."
                )
              }
              return
            }

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
            if (
              error instanceof Error &&
              error.message.includes("Cookies can only be modified")
            ) {
              if (process.env.NODE_ENV !== "production") {
                console.debug(
                  "[supabase] cookie delete skipped outside of a server action or route handler."
                )
              }
              return
            }

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
