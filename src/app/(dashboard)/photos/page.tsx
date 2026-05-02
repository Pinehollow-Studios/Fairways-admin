import { ComingSoon, SectionHeader } from "@/components/admin/SectionHeader";

export default function PhotosPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <SectionHeader
        title="Photo moderation"
        description="Two-axis review (moderation_state + verification_state) per CLAUDE.md §6.1."
      />
      <ComingSoon note="Wires up when the moderation policy lands (open question §16.13)." />
    </div>
  );
}
