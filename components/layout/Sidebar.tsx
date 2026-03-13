import Link from "next/link";
import {
  Home,
  LogOut,
  Settings,
  Zap
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

const navItems = [
  {
    href: "/dashboard",
    label: "\uB300\uC2DC\uBCF4\uB4DC",
    icon: Home
  },
  {
    href: "/workflows",
    label: "\uC6CC\uD06C\uD50C\uB85C\uC6B0",
    icon: Zap
  },
  {
    href: "/settings",
    label: "API \uC124\uC815",
    icon: Settings
  }
];

export function Sidebar({
  className,
  currentPath,
  isLoggingOut,
  onLogout,
  onNavigate,
  userEmail
}: {
  className?: string;
  currentPath: string;
  isLoggingOut: boolean;
  onLogout: () => void;
  onNavigate: () => void;
  userEmail: string;
}) {
  return (
    <aside
      className={cn(
        "z-50 w-[240px] shrink-0 flex-col border-r border-white/10 bg-[#111111] p-5",
        className
      )}
    >
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4"
      >
        <div>
          <p className="font-mono text-base font-semibold text-[#e5e5e5]">
            Naier
          </p>
          <p className="text-xs text-zinc-500">Automation Workspace</p>
        </div>
      </Link>

      <nav className="mt-8 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            currentPath === item.href || currentPath.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition",
                isActive
                  ? "bg-[#00d4aa]/10 text-[#7ef5da]"
                  : "text-zinc-400 hover:bg-black/20 hover:text-zinc-100"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
          User
        </p>
        <p className="mt-2 break-all text-sm text-zinc-200">{userEmail}</p>
        <Button
          variant="outline"
          className="mt-4 w-full"
          onClick={onLogout}
          disabled={isLoggingOut}
        >
          <LogOut className="h-4 w-4" />
          {isLoggingOut
            ? "\uB85C\uADF8\uC544\uC6C3 \uC911..."
            : "\uB85C\uADF8\uC544\uC6C3"}
        </Button>
      </div>
    </aside>
  );
}
