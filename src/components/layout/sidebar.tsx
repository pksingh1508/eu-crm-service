"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import {
  BarChart3,
  Inbox,
  LayoutDashboard,
  LogOut,
  Mail,
  Users,
  FileText
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuthStore, type UserRole } from "@/stores/auth-store";
import { logoutAction } from "@/server/auth/actions";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import Image from "next/image";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
};

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
    },
    {
      href: "/admin/email-template",
      label: "Email Templates",
      icon: FileText,
      description: "Create & manage templates"
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
};

// Shows a spinner on the clicked item while its page loads (only if that takes
// longer than a moment, so fast navigations don't flicker)
const NavItemPendingIndicator = () => {
  const { pending } = useLinkStatus();

  return (
    <Spinner
      aria-hidden="true"
      className={cn(
        "ml-auto size-3.5 opacity-0 transition-opacity",
        pending && "opacity-100 delay-150"
      )}
    />
  );
};

const SidebarNavItem = ({ item }: { item: NavItem }) => {
  const pathname = usePathname();
  const isExactMatch = pathname === item.href;
  const segments = item.href.split("/").filter(Boolean);
  const allowNestedMatch = segments.length > 1;
  const isNestedRoute =
    allowNestedMatch && !isExactMatch && pathname?.startsWith(`${item.href}/`);
  const isActive = isExactMatch || Boolean(isNestedRoute);

  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      title={item.description}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors duration-200",
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon
        className={cn(
          "size-4 shrink-0 transition-colors duration-200",
          isActive
            ? "text-primary-foreground"
            : "text-muted-foreground group-hover:text-foreground"
        )}
      />
      <span className="truncate">{item.label}</span>
      <NavItemPendingIndicator />
    </Link>
  );
};

const Sidebar = ({ className }: { className?: string }) => {
  const role = useAuthStore((state) => state.role);
  const clearAuth = useAuthStore((state) => state.clear);
  const router = useRouter();
  const [isLoggingOut, startLogout] = useTransition();

  const navItems = role ? NAVIGATION[role] : [];

  const handleLogout = () => {
    startLogout(async () => {
      try {
        await logoutAction();
        clearAuth();
        toast.success("Logout successfully");
        router.push("/login");
      } catch (error) {
        console.error("[sidebar] logout failed", error);
      }
    });
  };

  return (
    <aside
      className={cn(
        "hidden w-64 shrink-0 border-r bg-background md:flex md:flex-col",
        className
      )}
    >
      <div className="flex h-16 shrink-0 items-center gap-3 border-b px-5">
        <Image
          src="/euLogo.jpeg"
          alt="EU CRM Logo"
          width={32}
          height={32}
          className="size-8 rounded-lg"
          priority
        />
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold tracking-tight">
            EU CRM
          </p>
          <p className="truncate text-xs text-muted-foreground">
            Lead engagement workspace
          </p>
        </div>
      </div>
      <nav
        aria-label="Main navigation"
        className="flex-1 overflow-y-auto px-3 py-5"
      >
        {navItems.length > 0 ? (
          <>
            <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80">
              {role === "admin" ? "Admin" : "Workspace"}
            </p>
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.href}>
                  <SidebarNavItem item={item} />
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            No navigation available.
          </p>
        )}
      </nav>
      <div className="border-t p-3">
        <Button
          type="button"
          variant="ghost"
          className="w-full justify-start gap-3 px-3 text-muted-foreground hover:text-foreground"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? <Spinner /> : <LogOut />}
          {isLoggingOut ? "Signing out…" : "Log out"}
        </Button>
        <p className="mt-2 px-3 text-xs text-muted-foreground/80">
          &copy; {new Date().getFullYear()} EU Careers Serwis
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
