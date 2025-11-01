"use client";

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
        "flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6",
        className
      )}
    >
      <div className="flex flex-col">
        <p className="text-sm font-semibold text-slate-900">Good day!</p>
        <p className="text-xs text-slate-500">
          {role ? roleToLabel[role] ?? "User" : "Welcome to EU CRM"}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 border border-slate-200">
          <AvatarFallback className="bg-slate-900 text-sm font-semibold text-white">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="hidden text-left md:block">
          <p className="text-sm font-medium text-slate-900">
            {user?.email ?? "Guest"}
          </p>
          <p className="text-xs text-slate-500">
            {role ? roleToLabel[role] ?? role : "Not signed in"}
          </p>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
