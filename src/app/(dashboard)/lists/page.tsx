import { SectionHeader } from "@/components/admin/SectionHeader";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { avatarURL, listCoverURL } from "@/lib/storage";
import { QueueActions } from "./QueueActions";

/**
 * Row shape returned by `admin_list_verification_queue()` after
 * the 2026-05-03 enrichment migration
 * (`20260503111000_admin_verification_queue_enrich.sql`).
 *
 * Earlier shape was just `(list_id, list_name, owner_user_id,
 * owner_username, verification_requested_at, course_count)`. The
 * widened shape ships the full review payload — description,
 * cover, owner profile, embedded courses array — so a moderator
 * can decide on the dashboard without separate queries against
 * `user_lists`, `users`, `user_list_courses`, `clubs`, `counties`.
 */
type CourseRow = {
  course_id: string;
  course_name: string;
  club_name: string | null;
  county_name: string | null;
  position: number | null;
};

type QueueRow = {
  list_id: string;
  list_name: string;
  list_description: string | null;
  privacy_kind: string;
  cover_storage_key: string | null;
  created_at: string;
  updated_at: string;
  verification_requested_at: string;
  owner_user_id: string;
  owner_username: string;
  owner_display_name: string | null;
  owner_first_name: string | null;
  owner_avatar_photo_id: string | null;
  owner_bio: string | null;
  course_count: number;
  // `jsonb_agg` on the SQL side serialises into a typed array
  // here. Capped at 500 server-side; if the cap bites,
  // `course_count > courses.length`.
  courses: CourseRow[] | null;
};

export const dynamic = "force-dynamic";

export default async function ListVerificationPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_list_verification_queue");
  const queue = (data as QueueRow[] | null) ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <SectionHeader
        title="List verification"
        description="Public user lists awaiting the verified stamp. Review the full content — title, description, cover, courses, owner — then approve to set verified_at (which freezes the list against further edits) or reject to clear the request and let the owner re-edit."
      />

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load queue: {error.message}
        </div>
      )}

      {!error && queue.length === 0 && (
        <div className="rounded-lg border border-dashed bg-card/50 p-12 text-center">
          <p className="text-sm font-medium">Queue is empty</p>
          <p className="mt-1 text-sm text-muted-foreground">
            No public lists are awaiting verification.
          </p>
        </div>
      )}

      {queue.length > 0 && (
        <div className="space-y-4">
          {queue.map((row) => (
            <QueueCard key={row.list_id} row={row} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Single review card. Two-column layout on `md+`: cover image
 * banner left (16:9, fills the column), every other field right.
 * Stacks vertically on small screens.
 */
function QueueCard({ row }: { row: QueueRow }) {
  const coverURL = listCoverURL(row.cover_storage_key);
  const ownerAvatarURL = avatarURL(row.owner_user_id, row.owner_avatar_photo_id);
  const courses = row.courses ?? [];
  const truncated = courses.length < row.course_count;

  return (
    <div className="overflow-hidden rounded-xl border bg-card ring-1 ring-foreground/10">
      <div className="grid gap-0 md:grid-cols-[280px_1fr]">
        <CoverBanner url={coverURL} title={row.list_name} />
        <div className="flex flex-col gap-4 p-5">
          <header className="space-y-2">
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-1">
                <h2 className="font-heading text-xl leading-tight">
                  {row.list_name}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Requested {formatRequested(row.verification_requested_at)} ·
                  created {formatDate(row.created_at)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="secondary">{row.privacy_kind}</Badge>
                <Badge variant="outline">
                  {row.course_count}{" "}
                  {row.course_count === 1 ? "course" : "courses"}
                </Badge>
                {truncated && (
                  <Badge variant="destructive">
                    truncated to {courses.length}
                  </Badge>
                )}
              </div>
            </div>
          </header>

          {row.list_description && (
            <section className="rounded-lg bg-muted/30 p-3 text-sm leading-relaxed">
              {row.list_description}
            </section>
          )}

          <OwnerBlock
            displayName={row.owner_display_name}
            firstName={row.owner_first_name}
            username={row.owner_username}
            avatarURL={ownerAvatarURL}
            bio={row.owner_bio}
          />

          <CourseList courses={courses} totalCount={row.course_count} />

          <footer className="flex justify-end pt-2">
            <QueueActions listId={row.list_id} listName={row.list_name} />
          </footer>
        </div>
      </div>
    </div>
  );
}

function CoverBanner({
  url,
  title,
}: {
  url: string | null;
  title: string;
}) {
  if (url) {
    return (
      // Plain <img> rather than next/image to avoid the
      // `images.remotePatterns` config — the dashboard is a
      // low-traffic admin tool, the bytes are public-read,
      // image optimisation isn't load-bearing here.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={`Cover for ${title}`}
        className="aspect-video w-full bg-muted object-cover md:aspect-auto md:h-full"
      />
    );
  }
  return (
    <div className="flex aspect-video w-full items-center justify-center bg-muted text-xs uppercase tracking-wider text-muted-foreground md:aspect-auto md:h-full">
      No cover
    </div>
  );
}

function OwnerBlock({
  displayName,
  firstName,
  username,
  avatarURL,
  bio,
}: {
  displayName: string | null;
  firstName: string | null;
  username: string;
  avatarURL: string | null;
  bio: string | null;
}) {
  const initials = ownerInitials({ displayName, firstName, username });
  const heading = displayName ?? firstName ?? username;
  return (
    <section className="flex items-start gap-3 rounded-lg border bg-background/40 p-3">
      {avatarURL ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarURL}
          alt={`${heading}'s avatar`}
          className="h-10 w-10 shrink-0 rounded-full bg-muted object-cover ring-1 ring-foreground/10"
        />
      ) : (
        <div
          aria-hidden
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary ring-1 ring-foreground/10"
        >
          {initials}
        </div>
      )}
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-medium leading-tight">
          {heading}
          <span className="ml-1.5 text-xs font-normal text-muted-foreground">
            @{username}
          </span>
        </p>
        {bio ? (
          <p className="text-xs leading-snug text-muted-foreground">{bio}</p>
        ) : (
          <p className="text-xs italic text-muted-foreground/70">No bio set</p>
        )}
      </div>
    </section>
  );
}

function CourseList({
  courses,
  totalCount,
}: {
  courses: CourseRow[];
  totalCount: number;
}) {
  if (totalCount === 0) {
    return (
      <section className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
        No courses on this list.
      </section>
    );
  }
  return (
    <section className="space-y-2">
      <details className="group rounded-lg border bg-background/40">
        <summary className="flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-xs font-medium text-muted-foreground select-none">
          <span>Courses ({totalCount})</span>
          <span className="text-muted-foreground/70 group-open:hidden">
            Show all
          </span>
          <span className="hidden text-muted-foreground/70 group-open:inline">
            Hide
          </span>
        </summary>
        <ol className="divide-y border-t text-sm">
          {courses.map((course, index) => (
            <li
              key={course.course_id}
              className="flex items-baseline gap-3 px-3 py-2"
            >
              <span className="w-6 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                {course.position ?? index + 1}.
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{course.course_name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {[course.club_name, course.county_name]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </details>
    </section>
  );
}

function ownerInitials({
  displayName,
  firstName,
  username,
}: {
  displayName: string | null;
  firstName: string | null;
  username: string;
}): string {
  const source = displayName ?? firstName ?? username;
  const parts = source.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  if (parts.length === 1 && parts[0].length > 0) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return "?";
}

function formatRequested(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.round(diffMs / 60_000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.round(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
