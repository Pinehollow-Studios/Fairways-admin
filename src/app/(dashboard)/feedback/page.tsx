import { ComingSoon, SectionHeader } from "@/components/admin/SectionHeader";

export default function FeedbackPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <SectionHeader
        title="Feedback triage"
        description="In-app feedback reports — change status, add notes, fire close-the-loop notifications (CLAUDE.md §13.3)."
      />
      <ComingSoon note="Wires up when the iOS feedback button + feedback_reports table land." />
    </div>
  );
}
