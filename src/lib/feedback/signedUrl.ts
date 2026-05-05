"use server";

import { createClient } from "@/lib/supabase/server";

const FEEDBACK_BUCKET = "feedback-screenshots";

/**
 * Mint a short-lived signed URL for a single object in the
 * `feedback-screenshots` private bucket. Server-only; called from
 * the report detail page Server Component.
 *
 * The bucket is admin-read via the
 * `feedback_screenshots_select_admin` RLS policy
 * (`20260504210100_feedback_storage_bucket.sql`); admins must
 * therefore use signed URLs minted server-side rather than the
 * unsigned `/object/public/...` shape used for avatars / list
 * covers / course covers.
 */
export async function feedbackScreenshotSignedURL(
  storagePath: string,
  expiresInSeconds = 60 * 60,
): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(FEEDBACK_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);
  if (error) {
    console.error("feedback signed URL failed", error);
    return null;
  }
  return data?.signedUrl ?? null;
}

/** Batch helper. Returns same-order list with `null` slots for any
 * paths that failed to sign. */
export async function feedbackScreenshotSignedURLs(
  storagePaths: string[],
  expiresInSeconds = 60 * 60,
): Promise<Array<string | null>> {
  if (storagePaths.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(FEEDBACK_BUCKET)
    .createSignedUrls(storagePaths, expiresInSeconds);
  if (error || !data) {
    console.error("feedback signed URLs failed", error);
    return storagePaths.map(() => null);
  }
  return storagePaths.map((path) => {
    const found = data.find((row) => row.path === path);
    return found?.signedUrl ?? null;
  });
}
