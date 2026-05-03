/**
 * Shared types for the curated-list admin surface.
 *
 * Mirrors the iOS-side `CuratedList` + `CuratedListSummary` types
 * (`Fairways/Models/CuratedList.swift`) so the field names + meaning
 * stay aligned across the two clients reading the same Supabase
 * tables. The DB columns themselves are documented in
 * `20260503120000_curated_lists_richer_publishing.sql`.
 */

export type CuratedListTier = "flagship" | "standard";

export type CuratedListStatus =
  | "draft" // published_at is null
  | "scheduled" // published_at > now
  | "live" // published_at <= now AND (unpublished_at null OR > now)
  | "expired" // unpublished_at <= now
  | "archived"; // is_archived = true (overrides the others for display)

/**
 * Compact row shape used by the index table — read straight off
 * `curated_lists` plus a server-side count of the join table.
 */
export type CuratedListRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  bio: string | null;
  tags: string[];
  region: string | null;
  tier: CuratedListTier | null;
  display_priority: number | null;
  is_ordered: boolean;
  cover_storage_key: string | null;
  published_at: string | null;
  unpublished_at: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  course_count: number;
};

/**
 * Course row attached to a curated list — the editor pages render
 * one row per course in `curated_list_courses` joined to `courses`
 * + `clubs` + `counties` for display names.
 */
export type CuratedCourseRow = {
  course_id: string;
  course_name: string;
  club_name: string | null;
  county_name: string | null;
  position: number | null;
  editor_note: string | null;
};

/**
 * Course catalog row used by the picker sheet — every course in
 * the dataset, joined to its club + county names so admins can
 * pick by recognisable label.
 */
export type CourseCatalogRow = {
  course_id: string;
  course_name: string;
  club_name: string | null;
  county_name: string | null;
};

export function statusFor(row: CuratedListRow, now: Date = new Date()): CuratedListStatus {
  if (row.is_archived) return "archived";
  if (!row.published_at) return "draft";
  const published = new Date(row.published_at);
  if (published > now) return "scheduled";
  if (row.unpublished_at) {
    const unpublished = new Date(row.unpublished_at);
    if (unpublished <= now) return "expired";
  }
  return "live";
}

export const STATUS_LABELS: Record<CuratedListStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  live: "Live",
  expired: "Expired",
  archived: "Archived",
};

/** Tailwind class hint for the status badge variant — picked to
 *  match the dashboard's badge.tsx variants without forking it. */
export const STATUS_VARIANT: Record<
  CuratedListStatus,
  "default" | "secondary" | "destructive" | "outline" | "ghost"
> = {
  draft: "outline",
  scheduled: "secondary",
  live: "default",
  expired: "destructive",
  archived: "ghost",
};
