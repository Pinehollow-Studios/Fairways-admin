import { OverviewCard, PreviewList, StatusBreakdown } from "@/components/admin/OverviewCard";
import { StatsStrip, type Stat } from "@/components/admin/StatsStrip";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { statusFor, type CuratedListStatus } from "./curated/types";

export const dynamic = "force-dynamic";

/**
 * Row shape returned by `admin_list_verification_queue()` — same
 * type lives on `(dashboard)/lists/page.tsx`. Kept loose here
 * (only the fields the overview reads) since this surface is
 * preview-only.
 */
type ListQueueRow = {
  list_id: string;
  list_name: string;
  owner_username: string;
  course_count: number;
  verification_requested_at: string;
};

type CuratedRow = {
  id: string;
  name: string;
  published_at: string | null;
  unpublished_at: string | null;
  is_archived: boolean;
  updated_at: string;
};

export default async function OverviewPage() {
  const supabase = await createClient();
  const admin = await requireAdmin();

  // Fetch real data for the two live sections in parallel. Each
  // result is independently nullable — if either query 500s the
  // dashboard still renders, the affected card just shows `—`.
  const [queueRes, curatedRes] = await Promise.all([
    supabase.rpc("admin_list_verification_queue"),
    supabase
      .from("curated_lists")
      .select("id,name,published_at,unpublished_at,is_archived,updated_at")
      .order("updated_at", { ascending: false }),
  ]);

  const queue: ListQueueRow[] = (queueRes.data as ListQueueRow[] | null) ?? [];
  const curated: CuratedRow[] = (curatedRes.data as CuratedRow[] | null) ?? [];

  const curatedByStatus = bucketCurated(curated);
  const curatedLiveCount = curatedByStatus.live;
  const curatedDraftCount = curatedByStatus.draft + curatedByStatus.scheduled;

  const stats: Stat[] = [
    {
      key: "verification",
      label: "Pending verifications",
      value: queue.length,
      hint:
        queue.length === 0
          ? "Queue clear"
          : queue.length === 1
            ? "1 list awaiting review"
            : `${queue.length} lists awaiting review`,
      tone: queue.length > 0 ? "attention" : "muted",
    },
    {
      key: "curated-live",
      label: "Curated lists live",
      value: curatedLiveCount,
      hint:
        curatedDraftCount > 0
          ? `${curatedDraftCount} in draft / scheduled`
          : "No drafts in flight",
    },
    {
      key: "photos",
      label: "Photos pending",
      value: null,
      hint: "Wires up with iOS slice",
    },
    {
      key: "feedback",
      label: "Open feedback",
      value: null,
      hint: "Wires up with iOS slice",
    },
  ];

  const queuePreview = queue.slice(0, 4).map((row) => ({
    key: row.list_id,
    primary: row.list_name,
    secondary: `@${row.owner_username} · ${row.course_count} ${row.course_count === 1 ? "course" : "courses"}`,
    trailing: relativeTime(row.verification_requested_at),
  }));

  const curatedPreview = curated.slice(0, 4).map((row) => ({
    key: row.id,
    primary: row.name,
    secondary: prettyStatus(curatedStatus(row)),
    trailing: relativeTime(row.updated_at),
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <HeroGreeting email={admin.email} queueLen={queue.length} curatedLive={curatedLiveCount} />

      <StatsStrip stats={stats} />

      <section className="space-y-4">
        <SectionLabel
          title="Queues"
          subtitle="Time-sensitive review work — clear these first."
          accent="queues"
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <OverviewCard
            href="/lists"
            title="List verification"
            description="Public user lists awaiting the verified stamp. Approve to freeze, reject to clear and let the owner re-edit."
            status="live"
            count={queue.length}
            accent={queue.length === 0 ? "All clear" : "in queue"}
            ctaLabel={queue.length === 0 ? "Open queue" : `Review ${queue.length}`}
          >
            <PreviewList
              items={queuePreview}
              emptyLabel="No public lists are awaiting verification."
            />
          </OverviewCard>

          <OverviewCard
            href="/scorecards"
            title="Scorecard verification"
            description="Manual evidence path for rounds without GPS coverage. Reviewer confirms scorecard photo against course data."
            status="soon"
            plannedSurfaces={[
              "Pending scorecards needing reviewer eyes",
              "Side-by-side scorecard photo + entered scores",
              "GPS gap reason and assigned reviewer",
              "Approve / reject with reason codes",
            ]}
          />

          <OverviewCard
            href="/photos"
            title="Photo moderation"
            description="User-uploaded course photos awaiting moderation before they show on course pages."
            status="soon"
            plannedSurfaces={[
              "Grid of pending photos with original uploader",
              "Course context and prior approved photos",
              "Bulk approve / reject keyboard flow",
              "Reasoned rejection that hides + notifies",
            ]}
          />

          <OverviewCard
            href="/feedback"
            title="Feedback triage"
            description="In-app feedback and bug reports awaiting acknowledgement."
            status="soon"
            plannedSurfaces={[
              "Inbox of open reports by severity",
              "Linked user, build, device, and screen",
              "Tag, assign, and reply inline",
              "Auto-close on app version bump",
            ]}
          />
        </div>
      </section>

      <section className="space-y-4">
        <SectionLabel
          title="Editorial"
          subtitle="Content under Fairways’ own byline."
          accent="editorial"
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <OverviewCard
            href="/curated"
            title="Curated lists"
            description="Editorial collections — title, bio, cover, courses, publish state. What users see in the app."
            status="live"
            count={curated.length}
            accent="lists total"
            ctaLabel={`Open ${curated.length} ${curated.length === 1 ? "list" : "lists"}`}
          >
            <div className="space-y-3">
              <StatusBreakdown
                segments={[
                  { key: "live", label: "Live", count: curatedByStatus.live, tone: "live" },
                  { key: "scheduled", label: "Scheduled", count: curatedByStatus.scheduled, tone: "scheduled" },
                  { key: "draft", label: "Draft", count: curatedByStatus.draft, tone: "draft" },
                  { key: "expired", label: "Expired", count: curatedByStatus.expired, tone: "expired" },
                  { key: "archived", label: "Archived", count: curatedByStatus.archived, tone: "archived" },
                ]}
              />
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-3">
                  Recently edited
                </p>
                <PreviewList
                  items={curatedPreview}
                  emptyLabel="No curated lists yet."
                />
              </div>
            </div>
          </OverviewCard>

          <OverviewCard
            href="/courses"
            title="Courses"
            description="Master course catalogue — search, filter, edit editorial fields (par, yards, style, established, description), upload hero photos."
            status="live"
            ctaLabel="Open catalogue"
          />
        </div>
      </section>

      <section className="space-y-4">
        <SectionLabel
          title="Insights"
          subtitle="Signal across product, content, and ops."
          accent="insights"
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <OverviewCard
            href="/analytics"
            title="Analytics"
            description="Metabase embed on top of Supabase — DAU, retention, list and round funnels."
            status="soon"
            plannedSurfaces={[
              "Embedded Metabase dashboards",
              "DAU, WAU, MAU and rolling retention",
              "List + round funnels with cohort splits",
              "Per-course traffic and engagement",
            ]}
          />
        </div>
      </section>

      {(queueRes.error || curatedRes.error) && (
        <div className="rounded-2xl border border-alert/40 bg-alert/10 p-4 text-xs text-alert">
          Some live data failed to load:
          {queueRes.error && <> verification queue ({queueRes.error.message}).</>}
          {curatedRes.error && <> curated lists ({curatedRes.error.message}).</>}
        </div>
      )}
    </div>
  );
}

/**
 * Branded hero. Sets the tone for the whole dashboard with a deep
 * brand-green panel, an editorial serif greeting, and at-a-glance
 * "what's hot today" copy keyed off the live counts.
 */
function HeroGreeting({
  email,
  queueLen,
  curatedLive,
}: {
  email: string | null;
  queueLen: number;
  curatedLive: number;
}) {
  const greeting = greetingFor(new Date());
  const name = email?.split("@")[0] ?? "admin";
  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-brand-deep/30 px-6 py-8 text-brand-fg shadow-[0_24px_48px_-24px_color-mix(in_oklab,var(--brand-deep)_55%,transparent)] sm:px-8 sm:py-10"
      style={{
        background:
          "linear-gradient(135deg, var(--brand-deep) 0%, var(--brand) 60%, color-mix(in oklab, var(--brand) 65%, var(--brand-soft)) 100%)",
      }}
    >
      {/* Faint topo-style overlay — circles evoke the iOS map polygons. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "radial-gradient(circle at 90% 10%, rgba(251,246,232,0.35) 0%, transparent 50%)," +
            "radial-gradient(circle at 10% 100%, rgba(251,246,232,0.18) 0%, transparent 60%)",
        }}
      />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-fg/70">
            {greeting} · {todayLabel(new Date())}
          </p>
          <h1 className="display-serif text-3xl font-semibold leading-tight sm:text-4xl">
            Welcome back, <span className="italic">{name}</span>.
          </h1>
          <p className="max-w-prose text-sm leading-relaxed text-brand-fg/85">
            {summaryLine(queueLen, curatedLive)}
          </p>
        </div>
        <ul className="flex shrink-0 flex-wrap gap-3 text-brand-fg/95">
          <HeroPill label="In queue" value={queueLen} highlight={queueLen > 0} />
          <HeroPill label="Curated live" value={curatedLive} />
        </ul>
      </div>
    </section>
  );
}

function HeroPill({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <li
      className={
        "flex min-w-[120px] flex-col gap-1 rounded-2xl border border-brand-fg/15 bg-brand-deep/30 px-4 py-3 backdrop-blur-sm" +
        (highlight ? " ring-1 ring-brand-fg/40" : "")
      }
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-fg/70">
        {label}
      </span>
      <span className="font-hero text-3xl leading-none tabular-nums">
        {value}
      </span>
    </li>
  );
}

function summaryLine(queueLen: number, curatedLive: number): string {
  const queuePart =
    queueLen === 0
      ? "Verification queue is clear."
      : queueLen === 1
        ? "One list is waiting on verification."
        : `${queueLen} lists are waiting on verification.`;
  const curatedPart =
    curatedLive === 0
      ? " No curated lists are live yet — the editorial surface is ready for its first publish."
      : curatedLive === 1
        ? " One curated list is currently live in the iOS app."
        : ` ${curatedLive} curated lists are currently live in the iOS app.`;
  return queuePart + curatedPart;
}

function greetingFor(date: Date): string {
  const h = date.getHours();
  if (h < 5) return "Late night";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function todayLabel(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function SectionLabel({
  title,
  subtitle,
  accent,
}: {
  title: string;
  subtitle: string;
  accent: "queues" | "editorial" | "insights";
}) {
  const dotClass =
    accent === "queues"
      ? "bg-brand"
      : accent === "editorial"
        ? "bg-info"
        : "bg-bucket";
  return (
    <div className="flex items-end justify-between gap-3 border-b border-border/60 pb-2">
      <div className="flex items-center gap-2">
        <span aria-hidden className={"size-2 rounded-full " + dotClass} />
        <h2 className="font-heading text-sm font-semibold uppercase tracking-[0.14em] text-ink">
          {title}
        </h2>
      </div>
      <p className="hidden text-xs text-ink-3 sm:block">{subtitle}</p>
    </div>
  );
}

type CuratedBuckets = Record<CuratedListStatus, number>;

function curatedStatus(row: CuratedRow): CuratedListStatus {
  return statusFor({
    id: row.id,
    name: row.name,
    slug: "",
    description: null,
    bio: null,
    tags: [],
    region: null,
    tier: null,
    display_priority: null,
    is_ordered: false,
    cover_storage_key: null,
    published_at: row.published_at,
    unpublished_at: row.unpublished_at,
    is_archived: row.is_archived,
    created_at: row.updated_at,
    updated_at: row.updated_at,
    course_count: 0,
  });
}

function bucketCurated(rows: CuratedRow[]): CuratedBuckets {
  const buckets: CuratedBuckets = {
    draft: 0,
    scheduled: 0,
    live: 0,
    expired: 0,
    archived: 0,
  };
  for (const row of rows) {
    buckets[curatedStatus(row)] += 1;
  }
  return buckets;
}

function prettyStatus(status: CuratedListStatus): string {
  switch (status) {
    case "live":
      return "Live";
    case "scheduled":
      return "Scheduled";
    case "draft":
      return "Draft";
    case "expired":
      return "Expired";
    case "archived":
      return "Archived";
  }
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMins = Math.round(diffMs / 60_000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.round(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d`;
  const diffMonths = Math.round(diffDays / 30);
  return `${diffMonths}mo`;
}
