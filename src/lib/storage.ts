/**
 * Storage URL helpers for the public Supabase buckets the iOS app
 * uploads into.
 *
 * Both buckets are configured public-read on iOS-side (avatars at
 * `20260425200005_storage_buckets.sql`, list-covers at
 * `20260502130000_list_covers_bucket.sql` + the owner-write
 * widening at `20260503100000_list_covers_owner_writes.sql`), so
 * the URLs returned here are unsigned and cacheable.
 *
 * Path layouts:
 *   - avatars:     `<supabase-url>/storage/v1/object/public/avatars/<userID>/avatar.jpg?v=<photoID>`
 *   - list-covers: `<supabase-url>/storage/v1/object/public/list-covers/<key>` where `<key>` may
 *                  itself carry a `?v=<UUID>` cache-buster suffix
 *                  (cover_storage_key on user_lists is the
 *                  full path + query)
 *
 * Mirrors the iOS-side `AvatarURLProvider` /
 * `LiveListCoverURLProvider` so admins see exactly what users see.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

export function avatarURL(
  userId: string | null | undefined,
  photoId: string | null | undefined,
): string | null {
  if (!userId || !photoId || !SUPABASE_URL) return null;
  // The iOS client downcases its `UUID.uuidString` to match
  // `auth.uid()::text` (lowercase per Postgres). Storage paths
  // were written with that convention, so read with it too.
  const folder = userId.toLowerCase();
  return `${SUPABASE_URL}/storage/v1/object/public/avatars/${folder}/avatar.jpg?v=${photoId}`;
}

export function listCoverURL(key: string | null | undefined): string | null {
  if (!key || !SUPABASE_URL) return null;
  // The storage key may include a `?v=<UUID>` cache-buster query
  // suffix — split + re-mount the parts so the URL is well-formed
  // (path doesn't contain `?`, query slot carries the buster).
  // Mirrors `LiveListCoverURLProvider.coverURL(forStorageKey:)`.
  const [path, query] = key.split("?", 2);
  const base = `${SUPABASE_URL}/storage/v1/object/public/list-covers/${path}`;
  return query ? `${base}?${query}` : base;
}
