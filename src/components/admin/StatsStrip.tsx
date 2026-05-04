import { cn } from "@/lib/utils";

export type Stat = {
  key: string;
  label: string;
  value: number | null;
  hint?: string;
  /** Visual emphasis. `attention` highlights with brand green when
   *  the value is non-zero and worth surfacing. */
  tone?: "default" | "attention" | "muted";
};

/**
 * At-a-glance numbers row. Lives directly below the page heading.
 * `null` values render as an em-dash so unbuilt sections fit the
 * grid without making the dashboard feel half-finished.
 *
 * Each tile uses the brand display font for the numeral and the
 * editorial serif for the label so the dashboard reads like the
 * almanac it sits next to.
 */
export function StatsStrip({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat) => {
        const isNull = stat.value === null;
        const tone = stat.tone ?? "default";
        const showAttention = !isNull && tone === "attention" && (stat.value ?? 0) > 0;
        return (
          <div
            key={stat.key}
            className={cn(
              "group/stat relative flex flex-col gap-2 overflow-hidden rounded-xl border border-border/60 bg-paper-raised p-4 ring-1 ring-foreground/5 transition-colors",
              showAttention && "border-brand/40 ring-brand/15",
            )}
          >
            {/* Soft brand wash in the corner — adds a colour-accented
                texture to the stat without competing with the value. */}
            <span
              aria-hidden
              className={cn(
                "pointer-events-none absolute -right-8 -top-8 size-24 rounded-full opacity-60 transition-opacity",
                showAttention
                  ? "bg-brand/15"
                  : tone === "muted"
                    ? "bg-muted/40"
                    : "bg-brand/8",
              )}
            />
            <div className="relative flex items-center gap-2">
              <span
                aria-hidden
                className={cn(
                  "size-1.5 rounded-full",
                  showAttention
                    ? "bg-brand shadow-[0_0_0_3px_color-mix(in_oklab,var(--brand)_20%,transparent)]"
                    : isNull
                      ? "bg-ink-3/40"
                      : "bg-ink-3/60",
                )}
              />
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-3">
                {stat.label}
              </span>
            </div>
            <div className="relative flex items-baseline gap-1.5">
              <span
                className={cn(
                  "font-hero text-[34px] leading-none tabular-nums",
                  isNull
                    ? "text-ink-3/40"
                    : showAttention
                      ? "text-brand-deep dark:text-brand-soft"
                      : tone === "muted"
                        ? "text-ink-2"
                        : "text-ink",
                )}
              >
                {isNull ? "—" : stat.value}
              </span>
            </div>
            {stat.hint && (
              <span className="relative text-[11px] leading-snug text-ink-2">
                {stat.hint}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
