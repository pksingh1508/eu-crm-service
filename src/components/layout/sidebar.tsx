"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTransition } from "react"
import {
  BarChart3,
  Inbox,
  LayoutDashboard,
  Mail,
  Users
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useAuthStore, type UserRole } from "@/stores/auth-store"
import { logoutAction } from "@/server/auth/actions"
import { Button } from "@/components/ui/button"

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  description?: string
}

const NAVIGATION: Record<Exclude<UserRole, null>, NavItem[]> = {
  admin: [
    {
      href: "/admin",
      label: "Dashboard",
      icon: LayoutDashboard,
      description: "Overview & metrics"
    },
    {
      href: "/admin/leads",
      label: "Leads",
      icon: Inbox,
      description: "All captured leads"
    },
    {
      href: "/admin/workspace-emails",
      label: "Workspace Emails",
      icon: Mail,
      description: "Connected Gmail accounts"
    },
    {
      href: "/admin/team",
      label: "Team",
      icon: Users,
      description: "Members & assignments"
    },
    {
      href: "/admin/email-activity",
      label: "Email Activity",
      icon: BarChart3,
      description: "Tracking & filters"
    }
  ],
  team: [
    {
      href: "/team",
      label: "Dashboard",
      icon: LayoutDashboard,
      description: "Your performance"
    },
    {
      href: "/team/leads",
      label: "My Leads",
      icon: Inbox,
      description: "Assigned opportunities"
    },
    {
      href: "/team/email",
      label: "Email Center",
      icon: Mail,
      description: "Send & review emails"
    }
  ]
}

const SidebarNavItem = ({ item }: { item: NavItem }) => {
  const pathname = usePathname()
  const isExactMatch = pathname === item.href
  const segments = item.href.split("/").filter(Boolean)
  const allowNestedMatch = segments.length > 1
  const isNestedRoute =
    allowNestedMatch && !isExactMatch && pathname?.startsWith(`${item.href}/`)
  const isActive = isExactMatch || Boolean(isNestedRoute)

  const Icon = item.icon

  return (
    <Link
      href={item.href}
      className={cn(
        "group flex flex-col gap-1 rounded-lg px-3 py-2 transition",
        isActive
          ? "bg-slate-900 text-white shadow-sm"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      )}
    >
      <div className="flex items-center gap-2">
        <Icon
          className={cn(
            "h-4 w-4 transition",
            isActive ? "text-white" : "text-slate-500 group-hover:text-slate-900"
          )}
        />
        <span className="text-sm font-semibold">{item.label}</span>
      </div>
      {item.description ? (
        <p
          className={cn(
            "text-xs",
            isActive ? "text-slate-200" : "text-slate-400 group-hover:text-slate-600"
          )}
        >
          {item.description}
        </p>
      ) : null}
    </Link>
  )
}

const Sidebar = ({ className }: { className?: string }) => {
  const role = useAuthStore((state) => state.role)
  const isInitialized = useAuthStore((state) => state.isInitialized)
  const clearAuth = useAuthStore((state) => state.clear)
  const router = useRouter()
  const [isLoggingOut, startLogout] = useTransition()

  const navItems = role ? NAVIGATION[role] : []

  const handleLogout = () => {
    startLogout(async () => {
      try {
        await logoutAction()
        clearAuth()
        router.push("/login")
      } catch (error) {
        console.error("[sidebar] logout failed", error)
      }
    })
  }

  return (
    <aside
      className={cn(
        "hidden w-72 shrink-0 border-r border-slate-200 bg-white/80 backdrop-blur md:flex md:flex-col",
        className
      )}
    >
      <div className="flex h-20 items-center gap-2 border-b border-slate-200 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-base font-semibold text-white">
          EU
        </div>
        <div>
          <span className="text-sm font-semibold text-slate-900">
            EU CRM
          </span>
          <p className="text-xs text-slate-500">Lead engagement workspace</p>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-6">
        {!isInitialized ? (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-12 w-full animate-pulse rounded-lg bg-slate-100"
              />
            ))}
          </div>
        ) : navItems.length > 0 ? (
          navItems.map((item) => <SidebarNavItem key={item.href} item={item} />)
        ) : (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            No navigation available.
          </div>
        )}
      </nav>
      <div className="px-4 pb-6">
        <Button
          type="button"
          variant="outline"
          className="w-full justify-center gap-2 text-sm font-semibold"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? "Signing out..." : "Log out"}
        </Button>
        <p className="mt-4 text-xs text-slate-400">
          &copy; {new Date().getFullYear()} EU Careers Serwis
        </p>
      </div>
    </aside>
  )
}

export default Sidebar
