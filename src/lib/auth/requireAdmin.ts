import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AdminUser = {
  id: string;
  email: string | null;
};

// Server-side gate. Call from any (dashboard) page or layout to guarantee
// the request is from a signed-in admin. Redirects when not.
//
// TODO: when the `admins` table migration lands in Fairways-ios, extend this
// with a check against `is_admin(auth.uid())`. For now any authenticated
// Supabase user passes — fine for local scaffold work, NOT fine for prod.
export async function requireAdmin(): Promise<AdminUser> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { id: user.id, email: user.email ?? null };
}
