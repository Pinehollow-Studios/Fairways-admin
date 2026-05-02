type Props = {
  title: string;
  description?: string;
};

export function SectionHeader({ title, description }: Props) {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

export function ComingSoon({ note }: { note: string }) {
  return (
    <div className="rounded-lg border border-dashed bg-card/50 p-12 text-center">
      <p className="text-sm font-medium">Not yet wired</p>
      <p className="mt-1 text-sm text-muted-foreground">{note}</p>
    </div>
  );
}
