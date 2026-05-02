import { QueueTile } from "@/components/admin/QueueTile";

export default function OverviewPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Operational queues and editorial surfaces. Counts wire up when each
          iOS slice lands.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Queues
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <QueueTile
            href="/lists"
            title="List verification"
            description="Public user lists awaiting the verified stamp."
            status="live"
          />
          <QueueTile
            href="/scorecards"
            title="Scorecard verification"
            description="Manual evidence path for rounds without GPS."
            status="soon"
          />
          <QueueTile
            href="/photos"
            title="Photo moderation"
            description="Pending photos in the moderation queue."
            status="soon"
          />
          <QueueTile
            href="/feedback"
            title="Feedback triage"
            description="In-app reports awaiting acknowledgement."
            status="soon"
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Editorial
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <QueueTile
            href="/courses"
            title="Courses & lists"
            description="Course details, tiers, curated list membership."
            status="soon"
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Insights
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <QueueTile
            href="/analytics"
            title="Analytics"
            description="Metabase embed on top of Supabase."
            status="soon"
          />
        </div>
      </section>
    </div>
  );
}
