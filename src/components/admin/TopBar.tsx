import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/admin/ModeToggle";
import { signOut } from "@/app/(dashboard)/actions";

type Props = {
  email: string | null;
};

export function TopBar({ email }: Props) {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-card/50 px-6 backdrop-blur">
      <div className="text-sm text-muted-foreground">
        {process.env.NODE_ENV === "production" ? "Production" : "Dev"}
      </div>
      <div className="flex items-center gap-3">
        {email && (
          <span className="text-sm text-muted-foreground">{email}</span>
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
