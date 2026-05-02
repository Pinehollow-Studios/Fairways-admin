"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  group: "queues" | "editorial" | "insights";
  ready: boolean;
};

const NAV: NavItem[] = [
  { href: "/", label: "Overview", group: "queues", ready: true },
  { href: "/lists", label: "List verification", group: "queues", ready: true },
  { href: "/scorecards", label: "Scorecards", group: "queues", ready: false },
  { href: "/photos", label: "Photo moderation", group: "queues", ready: false },
  { href: "/feedback", label: "Feedback triage", group: "queues", ready: false },
  { href: "/courses", label: "Courses & lists", group: "editorial", ready: false },
  { href: "/analytics", label: "Analytics", group: "insights", ready: false },
];

const GROUPS: Array<{ key: NavItem["group"]; label: string }> = [
  { key: "queues", label: "Queues" },
  { key: "editorial", label: "Editorial" },
  { key: "insights", label: "Insights" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r bg-card lg:block">
      <div className="flex h-14 items-center border-b px-5">
        <Link href="/" className="font-semibold tracking-tight">
          Fairways Admin
        </Link>
      </div>
      <nav className="space-y-6 p-4 text-sm">
        {GROUPS.map((group) => (
          <div key={group.key}>
            <p className="px-2 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {group.label}
            </p>
            <ul className="space-y-1">
              {NAV.filter((n) => n.group === group.key).map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center justify-between rounded-md px-2 py-1.5 transition-colors",
                        active
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                      )}
                    >
                      <span>{item.label}</span>
                      {!item.ready && (
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                          Soon
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
