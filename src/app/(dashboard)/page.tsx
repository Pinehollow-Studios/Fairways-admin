import { OverviewCard, PreviewList, StatusBreakdown } from "@/components/admin/OverviewCard";
import { StatsStrip, type Stat } from "@/components/admin/StatsStrip";
import { createClient } from "@/lib/supabase/server";
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

  // Stats row up top — only counts we can stand behind. Soon
  // sections render a `null` so the user sees the slot exists but
  // it isn't lying about the number.
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
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl tracking-tight">Overview</h1>
        <p className="max-w-prose text-sm text-muted-foreground">
          Operational queues and editorial surfaces. Counts are live where the
          backend is wired; soon sections describe what they&rsquo;ll show once
          the matching iOS slice lands.
        </p>
      </header>

      <StatsStrip stats={stats} />

      <section className="space-y-3">
        <SectionLabel
          title="Queues"
          subtitle="Time-sensitive review work — clear these first."
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-2">
          <OverviewCard
            href="/lists"
            title="List verification"
            description="Public user lists awaiting the verified stamp. Approve to freeze, reject to clear and let the owner re-edit."
            status="live"
            count={queue.length}
            accent={queue.length === 0 ? "All clear" : "in queue"}
            ctaLabel={queue.length === 0 ? "Open queue →" : `Review ${queue.length} →`}
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

      <section className="space-y-3">
        <SectionLabel
          title="Editorial"
          subtitle="Content under Fairways’ own byline."
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <OverviewCard
            href="/curated"
            title="Curated lists"
            description="Editorial collections — title, bio, cover, courses, publish state. What users see in the app."
            status="live"
            count={curated.length}
            accent="lists total"
            ctaLabel={`Open ${curated.length} ${curated.length === 1 ? "list" : "lists"} →`}
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
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
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
            description="Master course catalog — names, tiers, club + county joins, photos."
            status="soon"
            plannedSurfaces={[
              "Searchable course table with edit-in-place",
              "Tier and visibility controls per course",
              "Cover photo + gallery management",
              "Memberships across curated lists",
            ]}
          />
        </div>
      </section>

      <section className="space-y-3">
        <SectionLabel
          title="Insights"
          subtitle="Signal across product, content, and ops."
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
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-xs text-destructive">
          Some live data failed to load:
          {queueRes.error && <> verification queue ({queueRes.error.message}).</>}
          {curatedRes.error && <> curated lists ({curatedRes.error.message}).</>}
        </div>
      )}
    </div>
  );
}

function SectionLabel({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      <p className="hidden text-xs text-muted-foreground/80 sm:block">
        {subtitle}
      </p>
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
