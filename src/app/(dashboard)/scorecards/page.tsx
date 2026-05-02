import { ComingSoon, SectionHeader } from "@/components/admin/SectionHeader";

export default function ScorecardsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <SectionHeader
        title="Scorecard verification"
        description="Manual review of scorecard photos for rounds without GPS evidence (CLAUDE.md §6.3)."
      />
      <ComingSoon note="Wires up when the iOS scorecard upload flow lands." />
    </div>
  );
}
