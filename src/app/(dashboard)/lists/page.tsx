import { ComingSoon, SectionHeader } from "@/components/admin/SectionHeader";

export default function ListVerificationPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <SectionHeader
        title="List verification"
        description="Public user lists awaiting the verified stamp. Approve to set verified_at; reject with a reason note."
      />
      <ComingSoon note="First queue to wire up — the iOS request-verification CTA is live (CHANGELOG 2026-05-02)." />
    </div>
  );
}
