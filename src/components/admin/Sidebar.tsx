"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ClipboardCheck,
  Images,
  LayoutDashboard,
  ListChecks,
  type LucideIcon,
  MapPin,
  MessageSquareWarning,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  group: "queues" | "editorial" | "insights";
  ready: boolean;
  icon: LucideIcon;
  /** Optional dynamic count rendered in the right-side pill. */
  countKey?: string;
};

const NAV: NavItem[] = [
  { href: "/", label: "Overview", group: "queues", ready: true, icon: LayoutDashboard },
  {
    href: "/lists",
    label: "List verification",
    group: "queues",
    ready: true,
    icon: ListChecks,
    countKey: "verification",
  },
  { href: "/scorecards", label: "Scorecards", group: "queues", ready: false, icon: ClipboardCheck },
  { href: "/photos", label: "Photo moderation", group: "queues", ready: false, icon: Images },
  { href: "/feedback", label: "Feedback triage", group: "queues", ready: false, icon: MessageSquareWarning },
  { href: "/curated", label: "Curated lists", group: "editorial", ready: true, icon: Sparkles, countKey: "curated" },
  { href: "/courses", label: "Courses", group: "editorial", ready: false, icon: MapPin },
  { href: "/analytics", label: "Analytics", group: "insights", ready: false, icon: BarChart3 },
];

const GROUPS: Array<{ key: NavItem["group"]; label: string }> = [
  { key: "queues", label: "Queues" },
  { key: "editorial", label: "Editorial" },
  { key: "insights", label: "Insights" },
];

export function Sidebar({ counts }: { counts?: Record<string, number | undefined> }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border/70 bg-sidebar text-sidebar-foreground lg:flex lg:flex-col">
      <BrandHeader />
      <nav className="flex-1 space-y-7 px-3 py-5">
        {GROUPS.map((group) => (
          <div key={group.key}>
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-3/90">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {NAV.filter((n) => n.group === group.key).map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
                const count = item.countKey ? counts?.[item.countKey] : undefined;
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "group/nav relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground",
                      )}
                    >
                      {active && (
                        <span
                          aria-hidden
                          className="absolute inset-y-1.5 left-0 w-[3px] rounded-r-full bg-brand"
                        />
                      )}
                      <Icon
                        className={cn(
                          "size-4 shrink-0",
                          active ? "text-brand" : "text-ink-3 group-hover/nav:text-ink-2",
                        )}
                      />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      <NavTrailing ready={item.ready} count={count} active={active} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <SidebarFooter />
    </aside>
  );
}

function BrandHeader() {
  return (
    <Link
      href="/"
      className="flex h-16 items-center gap-3 border-b border-border/70 px-5"
    >
      <BrandMark className="size-9" />
      <div className="min-w-0 leading-tight">
        <p className="font-heading text-base font-semibold tracking-tight">
          Fairways
        </p>
        <p className="text-[11px] uppercase tracking-[0.18em] text-ink-3">
          Admin
        </p>
      </div>
    </Link>
  );
}

/**
 * The Fairways flag mark — pin/flag silhouette in brand green
 * with the cream paper foreground. Same metaphor used by the iOS
 * splash, scaled down. The wrapper is a square so it works as a
 * favicon-sized chip too.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl shadow-sm ring-1 ring-brand-deep/30",
        className,
      )}
      style={{
        background:
          "linear-gradient(135deg, var(--brand-deep) 0%, var(--brand) 60%, color-mix(in oklab, var(--brand) 70%, var(--brand-soft)) 100%)",
      }}
    >
      <svg
        viewBox="0 0 28 28"
        className="size-3/5 text-paper-raised"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* flagpole */}
        <line x1="9" y1="4" x2="9" y2="24" />
        {/* flag */}
        <path d="M9 5 L21 8 L17 11 L21 14 L9 14 Z" fill="currentColor" stroke="none" />
      </svg>
    </span>
  );
}

function NavTrailing({
  ready,
  count,
  active,
}: {
  ready: boolean;
  count: number | undefined;
  active: boolean;
}) {
  if (!ready) {
    return (
      <span className="rounded-full border border-border bg-paper-raised/60 px-1.5 py-px text-[9px] font-medium uppercase tracking-wider text-ink-3">
        Soon
      </span>
    );
  }
  if (count === undefined) return null;
  if (count === 0) {
    return (
      <span className="text-[10px] tabular-nums text-ink-3">0</span>
    );
  }
  return (
    <span
      className={cn(
        "min-w-[20px] rounded-full px-1.5 py-px text-center text-[10px] font-semibold tabular-nums",
        active
          ? "bg-brand text-brand-fg"
          : "bg-brand/15 text-brand-deep dark:text-brand-soft",
      )}
    >
      {count}
    </span>
  );
}

function SidebarFooter() {
  return (
    <div className="border-t border-border/70 px-5 py-4">
      <p className="text-[11px] leading-snug text-ink-3">
        Fairways Admin · {process.env.NODE_ENV === "production" ? "Production" : "Dev"}
      </p>
      <p className="mt-1 text-[11px] leading-snug text-ink-3/80">
        Editorial &amp; ops surface for the Fairways iOS app.
      </p>
    </div>
  );
}
