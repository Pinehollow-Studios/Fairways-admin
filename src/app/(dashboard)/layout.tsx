import { Sidebar } from "@/components/admin/Sidebar";
import { TopBar } from "@/components/admin/TopBar";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  // Pull lightweight counts in parallel so the sidebar can render
  // dynamic pip badges next to each live nav item. Failures fall
  // through silently — the nav item just shows no badge.
  const supabase = await createClient();
  const [queueRes, curatedRes, coursesRes, feedbackRes] = await Promise.all([
    supabase.rpc("admin_list_verification_queue"),
    supabase
      .from("curated_lists")
      .select("id", { count: "exact", head: true })
      .eq("is_archived", false),
    supabase
      .from("courses")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("feedback_reports")
      .select("id", { count: "exact", head: true })
      .in("status", ["new", "triaged", "inProgress"]),
  ]);

  const counts = {
    verification: Array.isArray(queueRes.data) ? queueRes.data.length : 0,
    curated: curatedRes.count ?? 0,
    courses: coursesRes.count ?? 0,
    feedback: feedbackRes.count ?? 0,
  };

  return (
    <div className="flex min-h-dvh bg-background">
      <Sidebar counts={counts} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar email={admin.email} role={admin.role} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
