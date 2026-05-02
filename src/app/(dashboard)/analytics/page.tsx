import { ComingSoon, SectionHeader } from "@/components/admin/SectionHeader";

export default function AnalyticsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <SectionHeader
        title="Analytics"
        description="Metabase on top of Supabase (CLAUDE.md §3 stack table). Embedded here, not custom-built."
      />
      <ComingSoon note="Wires up once Metabase is provisioned and embedded." />
    </div>
  );
}
