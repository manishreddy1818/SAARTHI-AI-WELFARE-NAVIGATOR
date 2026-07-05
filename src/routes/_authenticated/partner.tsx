import { createFileRoute } from "@tanstack/react-router";
import { Inbox, LineChart, Mic, Users } from "lucide-react";
import { PageShell } from "@/components/app-shell";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/partner")({
  head: () => ({
    meta: [
      { title: "Partner dashboard — SAARTHI" },
      { name: "description", content: "Welfare partner workspace on SAARTHI." },
    ],
  }),
  component: PartnerDashboard,
});

function PartnerDashboard() {
  const { user } = useAuth();
  const name = (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ?? "partner";
  return (
    <PageShell>
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium uppercase tracking-widest text-[var(--saffron)]">
            Welfare Partner
          </p>
          <h1
            className="text-3xl font-semibold sm:text-4xl"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}
          >
            Welcome back, {name}.
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Your intake queue, active citizens, and impact reporting will live here.
            The workspace is being prepared for you.
          </p>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Active citizens" value="0" />
          <StatCard label="This week's intakes" value="0" />
          <StatCard label="Benefits unlocked" value="0" />
          <StatCard label="Avg time to help" value="—" />
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <PanelCard icon={Mic} title="Voice intake" body="Start a guided voice conversation with a citizen and let SAARTHI capture their situation for you." />
          <PanelCard icon={Inbox} title="Follow-up queue" body="Citizens waiting for the next step — documents, approvals, or a conversation with you." />
          <PanelCard icon={Users} title="Your citizens" body="The people you're supporting today, sorted by urgency and status." />
          <PanelCard icon={LineChart} title="Impact" body="Benefits unlocked, families helped, and time saved — auto-updated as you work." />
        </div>
      </section>
    </PageShell>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
        {value}
      </p>
    </div>
  );
}

function PanelCard({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="flex items-start gap-4 rounded-3xl border border-dashed border-border bg-card/60 p-6">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-[var(--trust)]">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-lg font-semibold">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}