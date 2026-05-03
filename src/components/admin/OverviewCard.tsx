import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Status = "live" | "soon";

type Props = {
  href: string;
  title: string;
  description: string;
  status: Status;
  /** Primary count badge in the header (live only). */
  count?: number;
  /** Optional pill rendered next to the count, e.g. "3 due today". */
  accent?: string;
  /** Rich preview body — recent rows, status breakdown, etc. */
  children?: ReactNode;
  /** Bullet list of what the section will surface once wired (soon only). */
  plannedSurfaces?: string[];
  /** Footer CTA text. Defaults match status. */
  ctaLabel?: string;
};

/**
 * Single tile on the dashboard overview. Built to carry as much
 * shape as each section can offer:
 *
 *   - `live` cards take a count badge, optional accent pill, and a
 *     `children` slot for a preview list / breakdown bar.
 *   - `soon` cards take a `plannedSurfaces` array describing what
 *     the live version will show, so the dashboard doubles as a
 *     spec for the next batch of work.
 *
 * The whole card is a `Link` for live tiles (any nested clickable
 * elements should stay non-interactive), and a static block for
 * soon tiles so users don't get a dead-end navigation.
 */
export function OverviewCard({
  href,
  title,
  description,
  status,
  count,
  accent,
  children,
  plannedSurfaces,
  ctaLabel,
}: Props) {
  const isLive = status === "live";

  const body = (
    <div
      className={cn(
        "group relative flex h-full flex-col gap-4 rounded-xl border bg-card p-5 ring-1 ring-foreground/10 transition-colors",
        isLive
          ? "hover:border-foreground/30 hover:bg-accent/40"
          : "border-dashed bg-card/40",
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-heading text-base leading-tight">{title}</h3>
            {!isLive && (
              <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                Soon
              </Badge>
            )}
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
        {isLive && (count !== undefined || accent) && (
          <div className="flex flex-col items-end gap-1">
            {count !== undefined && (
              <span
                className={cn(
                  "tabular-nums",
                  count > 0
                    ? "text-2xl font-semibold leading-none"
                    : "text-2xl font-semibold leading-none text-muted-foreground/60",
                )}
              >
                {count}
              </span>
            )}
            {accent && (
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {accent}
              </span>
            )}
          </div>
        )}
      </header>

      {isLive && children && <div className="flex-1">{children}</div>}

      {!isLive && plannedSurfaces && plannedSurfaces.length > 0 && (
        <ul className="flex-1 space-y-1.5 text-xs text-muted-foreground/90">
          {plannedSurfaces.map((surface) => (
            <li key={surface} className="flex items-start gap-2">
              <span
                aria-hidden
                className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-muted-foreground/50"
              />
              <span className="leading-snug">{surface}</span>
            </li>
          ))}
        </ul>
      )}

      <footer className="flex items-center justify-between border-t pt-3 text-xs">
        <span
          className={cn(
            isLive
              ? "font-medium text-foreground"
              : "text-muted-foreground/70",
          )}
        >
          {ctaLabel ?? (isLive ? "Open →" : "Wires up when the iOS feature lands")}
        </span>
        {isLive && (
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
            Live
          </span>
        )}
      </footer>
    </div>
  );

  if (!isLive) return body;
  return (
    <Link href={href} className="block h-full">
      {body}
    </Link>
  );
}

/**
 * Inline list rendered inside a live OverviewCard's preview slot.
 * Each row is a label + secondary line + trailing meta — generic
 * enough to render lists, scorecards, photos, anything.
 */
export function PreviewList({
  items,
  emptyLabel,
}: {
  items: Array<{
    key: string;
    primary: string;
    secondary?: string;
    trailing?: string;
  }>;
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return (
      <p className="rounded-md border border-dashed bg-background/40 p-3 text-center text-xs text-muted-foreground">
        {emptyLabel}
      </p>
    );
  }
  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li
          key={item.key}
          className="flex items-baseline gap-2 rounded-md bg-background/40 px-2.5 py-1.5 text-xs"
        >
          <span className="min-w-0 flex-1 truncate font-medium">
            {item.primary}
          </span>
          {item.secondary && (
            <span className="hidden truncate text-muted-foreground sm:inline">
              {item.secondary}
            </span>
          )}
          {item.trailing && (
            <span className="shrink-0 tabular-nums text-muted-foreground/80">
              {item.trailing}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

/**
 * Horizontal status breakdown for the curated-lists card. Renders
 * a row of label + count pairs with a thin proportional bar
 * underneath so the editorial mix is readable at a glance.
 */
export function StatusBreakdown({
  segments,
}: {
  segments: Array<{ key: string; label: string; count: number; tone: "live" | "draft" | "scheduled" | "expired" | "archived" }>;
}) {
  const total = segments.reduce((sum, seg) => sum + seg.count, 0);
  const toneClass: Record<typeof segments[number]["tone"], string> = {
    live: "bg-emerald-500/80",
    draft: "bg-muted-foreground/40",
    scheduled: "bg-sky-500/80",
    expired: "bg-destructive/70",
    archived: "bg-muted-foreground/25",
  };
  return (
    <div className="space-y-2">
      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted">
        {total > 0 ? (
          segments.map((seg) =>
            seg.count === 0 ? null : (
              <div
                key={seg.key}
                className={toneClass[seg.tone]}
                style={{ width: `${(seg.count / total) * 100}%` }}
                aria-label={`${seg.label}: ${seg.count}`}
              />
            ),
          )
        ) : null}
      </div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-3">
        {segments.map((seg) => (
          <li key={seg.key} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span
                aria-hidden
                className={cn("h-2 w-2 shrink-0 rounded-full", toneClass[seg.tone])}
              />
              {seg.label}
            </span>
            <span className="tabular-nums">{seg.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
