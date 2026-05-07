/**
 * Thin Sentry Web API client. Server-only — never import from a
 * client component (the auth token would leak to the browser).
 *
 * Used by the `/crashes/[id]` detail page to lazily pull stack
 * traces, breadcrumbs, and device/contexts from Sentry on demand.
 * The local `crash_reports` table is the queue + index; the Sentry
 * Web API is the canonical store for forensic detail.
 *
 * ENVIRONMENT
 *   - SENTRY_AUTH_TOKEN  — Internal Integration auth token. Mint at
 *                          sentry.io → pinehollow-studios → Settings →
 *                          Developer Settings → fairways-admin →
 *                          Tokens. Permissions: Project: Read,
 *                          Issue & Event: Read, Member: Read.
 *   - SENTRY_ORG_SLUG    — `pinehollow-studios`.
 *   - SENTRY_PROJECT_SLUG — `fairways-ios`.
 *
 * All three live in `.env.local` (dev) and Vercel env (prod). Never
 * committed.
 *
 * Failure mode: every helper returns `null` (not `throw`) on missing
 * config / network failure / 4xx. The detail page renders a
 * "couldn't reach Sentry" placeholder rather than crashing the
 * route, because the local crash row is enough on its own.
 */

const SENTRY_API_BASE = "https://sentry.io/api/0";

function readEnv() {
  const token = process.env.SENTRY_AUTH_TOKEN;
  const org = process.env.SENTRY_ORG_SLUG;
  const project = process.env.SENTRY_PROJECT_SLUG;
  if (!token || !org || !project) return null;
  return { token, org, project };
}

/** Whether the Sentry client is configured at all. The detail page
 *  uses this to render an inline "Sentry not configured" hint
 *  instead of trying (and failing) to fetch. */
export function isSentryConfigured(): boolean {
  return readEnv() !== null;
}

/** Build the canonical Sentry Issue URL — opens in a new tab from
 *  the "Open in Sentry" button on the detail page. Does not require
 *  the API token; safe to call from anywhere. */
export function getSentryIssueURL(issueId: string): string | null {
  const env = readEnv();
  if (!env) return null;
  return `https://sentry.io/organizations/${env.org}/issues/${issueId}/`;
}

export type SentryEventDetail = {
  eventID: string;
  message: string | null;
  release: string | null;
  environment: string | null;
  platform: string | null;
  dateCreated: string | null;
  tags: Array<{ key: string; value: string }>;
  // Sentry's `entries` array carries arbitrary typed payloads
  // (exception, breadcrumbs, request, threads). We keep them as
  // unknown so admin code can render them defensively.
  entries: Array<{ type: string; data: unknown }>;
  contexts: Record<string, unknown> | null;
  user: { id?: string; email?: string; username?: string } | null;
};

/**
 * Fetch full event detail (stack trace, breadcrumbs, device,
 * contexts) from Sentry. Returns `null` on any failure.
 *
 * Cached for 60s via Next.js `fetch` cache headers — admin browsing
 * the same crash twice in a minute hits cache instead of Sentry's
 * rate limit.
 */
export async function fetchSentryEvent(
  eventId: string,
): Promise<SentryEventDetail | null> {
  const env = readEnv();
  if (!env) return null;
  // Sentry's event-detail endpoint accepts the dashless 32-char
  // event ID. Strip any dashes the caller might have introduced.
  const normalised = eventId.replace(/-/g, "").toLowerCase();
  if (normalised.length !== 32) return null;

  const url = `${SENTRY_API_BASE}/projects/${env.org}/${env.project}/events/${normalised}/`;
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Authorization: `Bearer ${env.token}` },
      next: { revalidate: 60 },
    });
  } catch {
    return null;
  }
  if (!response.ok) return null;
  let raw: unknown;
  try {
    raw = await response.json();
  } catch {
    return null;
  }
  const obj = raw as Record<string, unknown>;
  return {
    eventID: String(obj.eventID ?? eventId),
    message: typeof obj.message === "string" ? obj.message : null,
    release: typeof obj.release === "string" ? obj.release : null,
    environment: typeof obj.environment === "string" ? obj.environment : null,
    platform: typeof obj.platform === "string" ? obj.platform : null,
    dateCreated: typeof obj.dateCreated === "string" ? obj.dateCreated : null,
    tags: Array.isArray(obj.tags)
      ? (obj.tags as Array<{ key?: unknown; value?: unknown }>)
          .filter((t) => typeof t.key === "string" && typeof t.value === "string")
          .map((t) => ({ key: t.key as string, value: t.value as string }))
      : [],
    entries: Array.isArray(obj.entries)
      ? (obj.entries as Array<{ type?: unknown; data?: unknown }>)
          .filter((e) => typeof e.type === "string")
          .map((e) => ({ type: e.type as string, data: e.data ?? null }))
      : [],
    contexts: (obj.contexts as Record<string, unknown> | null) ?? null,
    user: (obj.user as SentryEventDetail["user"]) ?? null,
  };
}
