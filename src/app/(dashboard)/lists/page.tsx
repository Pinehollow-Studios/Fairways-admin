import { SectionHeader } from "@/components/admin/SectionHeader";
import { createClient } from "@/lib/supabase/server";
import { QueueActions } from "./QueueActions";

type QueueRow = {
  list_id: string;
  list_name: string;
  owner_user_id: string;
  owner_username: string;
  verification_requested_at: string;
  course_count: number;
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
        description="Public user lists awaiting the verified stamp. Approve to set verified_at; reject clears the request."
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
        <div className="overflow-hidden rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">List</th>
                <th className="px-4 py-2 font-medium">Owner</th>
                <th className="px-4 py-2 font-medium">Courses</th>
                <th className="px-4 py-2 font-medium">Requested</th>
                <th className="px-4 py-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((row) => (
                <tr key={row.list_id} className="border-b last:border-b-0">
                  <td className="px-4 py-3 font-medium">{row.list_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    @{row.owner_username}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.course_count}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatRequested(row.verification_requested_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <QueueActions
                        listId={row.list_id}
                        listName={row.list_name}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function formatRequested(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.round(diffMs / 60_000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.round(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}
