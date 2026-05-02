import { ComingSoon, SectionHeader } from "@/components/admin/SectionHeader";

export default function CoursesPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <SectionHeader
        title="Courses & lists"
        description="Editorial CRUD — course details, tiers, curated list membership, list cover uploads."
      />
      <ComingSoon note="Jack runs this in Supabase Studio + the runbook today (docs/admin-runbook.md). UI lands when batch frequency demands it." />
    </div>
  );
}
