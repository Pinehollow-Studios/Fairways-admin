import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AdminRole = "super_admin" | "moderator" | "editor";

export type AdminUser = {
  id: string;
  email: string | null;
  role: AdminRole;
};

// Server-side gate. Call from any (dashboard) page or layout to guarantee
// the request is from a signed-in admin. Redirects when not.
//
// Backed by the `public.admins` table + `is_admin()` / `admin_role()`
// helpers introduced in Fairways-ios migration 20260502140000_admins.sql.
// Bootstrap a first super_admin via docs/admin-runbook.md → "Setup —
// admin roster" before anyone can sign in.
export async function requireAdmin(): Promise<AdminUser> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: role, error } = await supabase.rpc("admin_role");

  if (error || !role) {
    redirect("/unauthorized");
  }

  return {
    id: user.id,
    email: user.email ?? null,
    role: role as AdminRole,
  };
}
