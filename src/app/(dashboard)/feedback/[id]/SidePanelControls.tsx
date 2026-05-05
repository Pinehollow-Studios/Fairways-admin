"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  type FeedbackSeverity,
  type FeedbackStatus,
  severityChipClasses,
  severityLabel,
  statusChipClasses,
  statusLabel,
} from "@/lib/feedback/types";
import {
  blockReporter,
  deleteReport,
  markDuplicateOf,
  setSeverity,
  setTags,
  transitionStatus,
  unblockReporter,
} from "../actions";

const STATUSES: FeedbackStatus[] = [
  "new",
  "triaged",
  "inProgress",
  "resolved",
  "wontFix",
];
const SEVERITIES: FeedbackSeverity[] = ["low", "medium", "high", "critical"];

/**
 * Right-side panel that bundles every admin control on a single
 * report (slice 4). Status, severity, tags, duplicate-of,
 * block-reporter, delete. Each control owns its own pending state
 * and toasts on success / failure.
 */
export function SidePanelControls({
  reportId,
  reporterUserId,
  initialStatus,
  initialSeverity,
  initialTags,
  initialDuplicateOf,
  isSuperAdmin,
}: {
  reportId: string;
  reporterUserId: string | null;
  initialStatus: FeedbackStatus;
  initialSeverity: FeedbackSeverity | null;
  initialTags: string[];
  initialDuplicateOf: string | null;
  isSuperAdmin: boolean;
}) {
  return (
    <div className="space-y-3">
      <StatusControl reportId={reportId} initial={initialStatus} />
      <SeverityControl reportId={reportId} initial={initialSeverity} />
      <TagsControl reportId={reportId} initial={initialTags} />
      <DuplicateOfControl reportId={reportId} initial={initialDuplicateOf} />
      {reporterUserId && (
        <BlockReporterControl userId={reporterUserId} />
      )}
      {isSuperAdmin && <DeleteReportControl reportId={reportId} />}
    </div>
  );
}

// --------------------------------------------------------------
// Status
// --------------------------------------------------------------

function StatusControl({
  reportId,
  initial,
}: {
  reportId: string;
  initial: FeedbackStatus;
}) {
  const [pending, startTransition] = useTransition();
  const [showResolutionFor, setShowResolutionFor] = useState<FeedbackStatus | null>(
    null,
  );
  const [resolutionNote, setResolutionNote] = useState("");

  const fire = (next: FeedbackStatus, note: string | null) => {
    startTransition(async () => {
      const result = await transitionStatus(reportId, next, note);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(`Status → ${statusLabel(next)}`);
      setShowResolutionFor(null);
      setResolutionNote("");
    });
  };

  return (
    <Panel title="Status">
      <div className="flex flex-wrap gap-1.5">
        {STATUSES.map((status) => {
          const isActive = status === initial;
          const isTerminal = status === "resolved" || status === "wontFix";
          return (
            <button
              key={status}
              type="button"
              disabled={pending || isActive}
              onClick={() => {
                if (isTerminal) {
                  setShowResolutionFor(status);
                } else {
                  fire(status, null);
                }
              }}
              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider transition ${statusChipClasses(status)} ${isActive ? "ring-2 ring-brand/40" : "opacity-80 hover:opacity-100"} disabled:cursor-not-allowed`}
            >
              {statusLabel(status)}
            </button>
          );
        })}
      </div>
      {showResolutionFor && (
        <div className="mt-3 space-y-2 rounded-xl border border-border bg-paper-sunken/40 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-3">
            Resolution note (required) — shown to the reporter verbatim
          </p>
          <textarea
            value={resolutionNote}
            onChange={(e) => setResolutionNote(e.target.value)}
            rows={3}
            placeholder="e.g. Fixed in 1.3.2 — please update the app."
            className="block w-full resize-y rounded-lg border border-border bg-paper-raised p-2 text-xs text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowResolutionFor(null)}
              className="rounded-md border border-border bg-paper-raised px-2.5 py-1 text-[11px] font-semibold text-ink-2"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={pending || !resolutionNote.trim()}
              onClick={() => fire(showResolutionFor, resolutionNote)}
              className="rounded-md bg-brand-deep px-2.5 py-1 text-[11px] font-semibold text-paper-raised disabled:opacity-60"
            >
              {pending ? "Saving…" : `Mark ${statusLabel(showResolutionFor)}`}
            </button>
          </div>
        </div>
      )}
    </Panel>
  );
}

// --------------------------------------------------------------
// Severity
// --------------------------------------------------------------

function SeverityControl({
  reportId,
  initial,
}: {
  reportId: string;
  initial: FeedbackSeverity | null;
}) {
  const [pending, startTransition] = useTransition();
  const fire = (severity: FeedbackSeverity | null) => {
    startTransition(async () => {
      const result = await setSeverity(reportId, severity);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(`Severity → ${severityLabel(severity)}`);
    });
  };

  return (
    <Panel title="Severity">
      <div className="flex flex-wrap gap-1.5">
        {SEVERITIES.map((severity) => {
          const isActive = severity === initial;
          return (
            <button
              key={severity}
              type="button"
              disabled={pending}
              onClick={() => fire(isActive ? null : severity)}
              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider transition ${severityChipClasses(severity)} ${isActive ? "ring-2 ring-brand/40" : "opacity-80 hover:opacity-100"} disabled:cursor-not-allowed`}
            >
              {severityLabel(severity)}
            </button>
          );
        })}
      </div>
    </Panel>
  );
}

// --------------------------------------------------------------
// Tags
// --------------------------------------------------------------

function TagsControl({
  reportId,
  initial,
}: {
  reportId: string;
  initial: string[];
}) {
  const [tags, setTagsLocal] = useState<string[]>(initial);
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();

  const persist = (next: string[]) => {
    startTransition(async () => {
      const result = await setTags(reportId, next);
      if ("error" in result) {
        toast.error(result.error);
        setTagsLocal(initial);
        return;
      }
      toast.success("Tags saved");
    });
  };

  const addTag = (raw: string) => {
    const cleaned = raw
      .replace(/^#+/, "")
      .toLowerCase()
      .trim();
    if (!cleaned) return;
    if (tags.includes(cleaned)) return;
    const next = [...tags, cleaned];
    setTagsLocal(next);
    setDraft("");
    persist(next);
  };

  const removeTag = (tag: string) => {
    const next = tags.filter((t) => t !== tag);
    setTagsLocal(next);
    persist(next);
  };

  return (
    <Panel title="Tags">
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <button
            key={tag}
            type="button"
            disabled={pending}
            onClick={() => removeTag(tag)}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-paper-sunken/60 px-2 py-0.5 text-[11px] text-ink-2 transition hover:border-alert/40 hover:text-alert"
          >
            {tag}
            <span aria-hidden className="text-ink-3 group-hover:text-alert">
              ×
            </span>
          </button>
        ))}
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag(draft);
            }
          }}
          placeholder="add tag…"
          className="min-w-24 rounded-full border border-dashed border-border bg-transparent px-2 py-0.5 text-[11px] text-ink-2 placeholder:text-ink-3 focus:border-brand focus:outline-none"
        />
      </div>
    </Panel>
  );
}

// --------------------------------------------------------------
// Duplicate-of
// --------------------------------------------------------------

function DuplicateOfControl({
  reportId,
  initial,
}: {
  reportId: string;
  initial: string | null;
}) {
  const [draft, setDraft] = useState(initial ?? "");
  const [pending, startTransition] = useTransition();
  const fire = () => {
    if (!draft.trim()) return;
    startTransition(async () => {
      const result = await markDuplicateOf(reportId, draft.trim());
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Marked as duplicate");
    });
  };

  return (
    <Panel title="Duplicate of">
      <div className="space-y-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="canonical report id (uuid)…"
          className="block w-full rounded-md border border-border bg-paper-raised px-2 py-1 text-[11px] font-mono text-ink-2 focus:border-brand focus:outline-none"
        />
        <button
          type="button"
          disabled={pending || !draft.trim()}
          onClick={fire}
          className="rounded-md bg-paper-sunken px-2.5 py-1 text-[11px] font-semibold text-ink-2 transition hover:bg-paper-raised disabled:opacity-60"
        >
          {pending ? "Linking…" : "Mark duplicate"}
        </button>
      </div>
    </Panel>
  );
}

// --------------------------------------------------------------
// Block reporter
// --------------------------------------------------------------

function BlockReporterControl({ userId }: { userId: string }) {
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const block = () => {
    startTransition(async () => {
      const result = await blockReporter(userId, reason || null);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Reporter blocked");
    });
  };
  const unblock = () => {
    startTransition(async () => {
      const result = await unblockReporter(userId);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Reporter unblocked");
    });
  };
  return (
    <Panel title="Block reporter">
      <div className="space-y-2">
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="reason (admin-only)…"
          className="block w-full rounded-md border border-border bg-paper-raised px-2 py-1 text-[11px] text-ink-2 focus:border-brand focus:outline-none"
        />
        <div className="flex gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={block}
            className="rounded-md border border-alert/40 bg-alert/10 px-2.5 py-1 text-[11px] font-semibold text-alert transition hover:bg-alert/20 disabled:opacity-60"
          >
            Block
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={unblock}
            className="rounded-md border border-border bg-paper-raised px-2.5 py-1 text-[11px] font-semibold text-ink-2 transition hover:bg-paper-sunken disabled:opacity-60"
          >
            Unblock
          </button>
        </div>
      </div>
    </Panel>
  );
}

// --------------------------------------------------------------
// Delete (super_admin only)
// --------------------------------------------------------------

function DeleteReportControl({ reportId }: { reportId: string }) {
  const [pending, startTransition] = useTransition();
  const fire = () => {
    if (!confirm("Hard delete this report and every reply / screenshot? This cannot be undone.")) {
      return;
    }
    startTransition(async () => {
      const result = await deleteReport(reportId);
      // delete redirects on success — only land here on error.
      if (result && "error" in result) {
        toast.error(result.error);
      }
    });
  };
  return (
    <Panel title="Danger zone">
      <button
        type="button"
        disabled={pending}
        onClick={fire}
        className="w-full rounded-md border border-alert/40 bg-alert/10 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-alert transition hover:bg-alert/20 disabled:opacity-60"
      >
        {pending ? "Deleting…" : "Delete report"}
      </button>
    </Panel>
  );
}

// --------------------------------------------------------------
// Shared panel wrapper
// --------------------------------------------------------------

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2 rounded-2xl border border-border bg-paper-raised p-3 ring-1 ring-foreground/5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-3">
        {title}
      </p>
      {children}
    </div>
  );
}
