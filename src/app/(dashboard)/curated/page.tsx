import Link from "next/link";
import { SectionHeader } from "@/components/admin/SectionHeader";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { listCoverURL } from "@/lib/storage";
import { NewCuratedListButton } from "./NewCuratedListButton";
import { STATUS_LABELS, STATUS_VARIANT, statusFor, type CuratedListRow } from "./types";

export const dynamic = "force-dynamic";

/**
 * Curated-lists index. Shows every row in `curated_lists`
 * regardless of state — admin RLS (`curated_lists_select_admin`
 * from `20260503120000_curated_lists_richer_publishing.sql`)
 * sees draft / scheduled / live / expired / archived alike. The
 * iOS app only sees the live subset.
 *
 * Each row links to `/curated/[id]` for editing.
 */
export default async function CuratedListsPage() {
  const supabase = await createClient();

  // Two queries: the rows themselves, then a per-row count from
  // `curated_list_courses`. Keeps the SQL surface here trivial;
  // a future RPC can fold the count in if the row count grows.
  const { data: lists, error: listsErr } = await supabase
    .from("curated_lists")
    .select(
      "id,name,slug,description,bio,tags,region,tier,display_priority,is_ordered,cover_storage_key,published_at,unpublished_at,is_archived,created_at,updated_at",
    )
    .order("is_archived", { ascending: true })
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  const counts: Record<string, number> = {};
  if (lists && lists.length > 0) {
    const { data: countRows } = await supabase
      .from("curated_list_courses")
      .select("curated_list_id")
      .in(
        "curated_list_id",
        lists.map((l) => l.id),
      );
    for (const row of countRows ?? []) {
      counts[row.curated_list_id] = (counts[row.curated_list_id] ?? 0) + 1;
    }
  }

  const rows: CuratedListRow[] = (lists ?? []).map((l) => ({
    ...l,
    course_count: counts[l.id] ?? 0,
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <SectionHeader
        title="Curated lists"
        description="Editorial collections owned by Fairways. Surface what users see in the app — title, bio, cover, tags, courses — and control when each list goes live, gets archived, or sunsets."
      />

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {rows.length} {rows.length === 1 ? "list" : "lists"} total
        </p>
        <NewCuratedListButton />
      </div>

      {listsErr && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load curated lists: {listsErr.message}
        </div>
      )}

      {!listsErr && rows.length === 0 && (
        <div className="rounded-lg border border-dashed bg-card/50 p-12 text-center">
          <p className="text-sm font-medium">No curated lists yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first one to start editorial collections.
          </p>
        </div>
      )}

      {rows.length > 0 && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {rows.map((row) => (
            <CuratedRowCard key={row.id} row={row} />
          ))}
        </div>
      )}
    </div>
  );
}

function CuratedRowCard({ row }: { row: CuratedListRow }) {
  const status = statusFor(row);
  const cover = listCoverURL(row.cover_storage_key);
  return (
    <Link
      href={`/curated/${row.id}`}
      className="group flex gap-4 overflow-hidden rounded-xl border bg-card p-3 ring-1 ring-foreground/10 transition-colors hover:bg-accent/40"
    >
      <CoverThumb url={cover} title={row.name} />
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="truncate font-heading text-base leading-snug">{row.name}</h2>
            <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABELS[status]}</Badge>
          </div>
          {row.description && (
            <p className="line-clamp-2 text-xs text-muted-foreground">
              {row.description}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {row.tier && (
            <Badge variant="secondary" className="capitalize">
              {row.tier}
            </Badge>
          )}
          <Badge variant="outline">
            {row.course_count} {row.course_count === 1 ? "course" : "courses"}
          </Badge>
          {row.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="font-normal">
              #{tag}
            </Badge>
          ))}
          {row.tags.length > 3 && (
            <span className="text-xs text-muted-foreground">+{row.tags.length - 3}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

function CoverThumb({ url, title }: { url: string | null; title: string }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={`Cover for ${title}`}
        className="h-20 w-28 shrink-0 rounded-md bg-muted object-cover"
      />
    );
  }
  return (
    <div className="flex h-20 w-28 shrink-0 items-center justify-center rounded-md bg-muted text-[10px] uppercase tracking-wider text-muted-foreground">
      No cover
    </div>
  );
}
