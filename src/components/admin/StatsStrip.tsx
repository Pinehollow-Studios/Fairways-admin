import { cn } from "@/lib/utils";

export type Stat = {
  key: string;
  label: string;
  value: number | null;
  hint?: string;
  tone?: "default" | "attention" | "muted";
};

/**
 * At-a-glance numbers row. Lives directly below the page heading.
 * `null` values render as an em-dash so unbuilt sections fit the
 * grid without making the dashboard feel half-finished.
 */
export function StatsStrip({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border ring-1 ring-foreground/10 sm:grid-cols-4">
      {stats.map((stat) => {
        const isNull = stat.value === null;
        const tone = stat.tone ?? "default";
        return (
          <div
            key={stat.key}
            className="flex flex-col gap-1 bg-card p-4"
          >
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {stat.label}
            </span>
            <span
              className={cn(
                "font-heading text-2xl leading-none tabular-nums",
                isNull && "text-muted-foreground/40",
                !isNull && tone === "attention" && "text-foreground",
                !isNull && tone === "muted" && "text-muted-foreground",
              )}
            >
              {isNull ? "—" : stat.value}
            </span>
            {stat.hint && (
              <span className="text-[11px] text-muted-foreground">
                {stat.hint}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
