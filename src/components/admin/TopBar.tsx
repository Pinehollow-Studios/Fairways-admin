import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/admin/ModeToggle";
import { signOut } from "@/app/(dashboard)/actions";
import type { AdminRole } from "@/lib/auth/requireAdmin";
import { cn } from "@/lib/utils";

type Props = {
  email: string | null;
  role?: AdminRole | null;
};

export function TopBar({ email, role }: Props) {
  const isProd = process.env.NODE_ENV === "production";
  const initials = (email ?? "?").trim().slice(0, 2).toUpperCase();
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-border/70 bg-paper-raised/85 px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <EnvBadge isProd={isProd} />
        <span className="hidden text-xs text-ink-3 md:inline">
          Editorial &amp; operations dashboard
        </span>
      </div>
      <div className="flex items-center gap-2">
        {role && <RoleBadge role={role} />}
        {email && (
          <div className="hidden items-center gap-2 rounded-full border border-border/70 bg-paper-sunken/60 py-1 pr-3 pl-1 sm:flex">
            <span
              aria-hidden
              className="flex size-6 items-center justify-center rounded-full bg-brand text-[10px] font-semibold uppercase tracking-wider text-brand-fg"
            >
              {initials}
            </span>
            <span className="text-xs font-medium text-ink-2">{email}</span>
          </div>
        )}
        <ModeToggle />
        <form action={signOut}>
          <Button type="submit" variant="ghost" size="sm">
            Sign out
          </Button>
        </form>
      </div>
    </header>
  );
}

function EnvBadge({ isProd }: { isProd: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider",
        isProd
          ? "border-alert/30 bg-alert/10 text-alert"
          : "border-brand/30 bg-brand/10 text-brand-deep dark:text-brand-soft",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-1.5 rounded-full",
          isProd ? "bg-alert" : "bg-brand",
        )}
      />
      {isProd ? "Production" : "Dev"}
    </span>
  );
}

function RoleBadge({ role }: { role: AdminRole }) {
  const label = roleLabel(role);
  return (
    <span className="hidden rounded-full border border-brand/25 bg-brand/8 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-brand-deep dark:bg-brand/15 dark:text-brand-soft sm:inline-flex">
      {label}
    </span>
  );
}

function roleLabel(role: AdminRole): string {
  switch (role) {
    case "super_admin":
      return "Super admin";
    case "moderator":
      return "Moderator";
    case "editor":
      return "Editor";
    default:
      return String(role);
  }
}
