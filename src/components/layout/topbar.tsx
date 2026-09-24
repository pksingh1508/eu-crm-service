"use client";

import Image from "next/image";

import { useAuthStore } from "@/stores/auth-store";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const roleToLabel: Record<string, string> = {
  admin: "Administrator",
  team: "Team Member"
};

const Topbar = ({ className }: { className?: string }) => {
  const user = useAuthStore((state) => state.user);
  const role = useAuthStore((state) => state.role);

  const initials = user?.email
    ? user.email
        .split("@")[0]
        .split(/[.\-_]/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("")
    : "?";

  return (
    <header
      className={cn(
        "flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-md sm:px-6 md:px-8",
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {/* The sidebar (and its logo) is hidden on small screens */}
        <Image
          src="/euLogo.jpeg"
          alt="EU CRM Logo"
          width={32}
          height={32}
          className="size-8 rounded-lg md:hidden"
        />
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold tracking-tight">
            Good day!
          </p>
          <p className="truncate text-xs text-muted-foreground">
            Welcome back to EU CRM
          </p>
        </div>
      </div>
      <div className="flex min-w-0 items-center gap-3">
        <Avatar className="size-9">
          <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="hidden min-w-0 leading-tight sm:block">
          <p className="max-w-64 truncate text-sm font-medium">
            {user?.email ?? "Guest"}
          </p>
          <p className="text-xs text-muted-foreground">
            {role ? roleToLabel[role] ?? role : "Not signed in"}
          </p>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
