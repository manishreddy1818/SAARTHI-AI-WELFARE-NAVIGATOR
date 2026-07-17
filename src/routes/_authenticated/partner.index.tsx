import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowRight,
  ClipboardCheck,
  Inbox,
  Mic,
  PlusCircle,
  Search,
  TrendingUp,
  Users,
} from "lucide-react";
import { PageShell } from "@/components/app-shell";
import { useAuth } from "@/hooks/use-auth";
import { listPartnerCitizens, partnerStats } from "@/lib/partner.functions";
import { StatusBadge } from "@/components/partner-status-badge";
import { lazy, Suspense } from "react";

// Decision dashboard runs a per-citizen scorer over the followups list;
// lazy-load so the initial partner-home paint is faster.
const PartnerDecisionDashboard = lazy(() =>
  import("@/components/partner-decision-dashboard").then((m) => ({
    default: m.PartnerDecisionDashboard,
  })),
);

export const Route = createFileRoute("/_authenticated/partner/")({
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
  const stats = useServerFn(partnerStats);
  const list = useServerFn(listPartnerCitizens);
  const statsQ = useQuery({ queryKey: ["partner-stats"], queryFn: () => stats() });
  const followupsQ = useQuery({
    queryKey: ["partner-followups"],
    queryFn: () => list({ data: {} }),
  });

  const s = statsQ.data ?? { total: 0, benefits: 0, started: 0, completed: 0, followUp: 0 };
  const recent = (followupsQ.data ?? []).slice(0, 5);
  const allCitizens = (followupsQ.data ?? []) as any[];

  return (
    <PageShell>
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
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
            Your intake queue, active citizens, and impact — one workspace for the families you serve.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Citizens assisted" value={String(s.total)} icon={Users} />
          <Stat
            label="Benefits unlocked"
            value={`₹${Number(s.benefits).toLocaleString("en-IN")}`}
            icon={TrendingUp}
          />
          <Stat label="Applications started" value={String(s.started)} icon={Inbox} />
          <Stat label="Applications completed" value={String(s.completed)} icon={ClipboardCheck} />
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <QuickAction to="/partner/intake" icon={PlusCircle} label="New citizen intake" tone="trust" />
          <QuickAction to="/partner/intake" search={{ mode: "voice" }} icon={Mic} label="Voice intake" tone="saffron" />
          <QuickAction to="/partner/citizens" icon={Search} label="Search citizens" tone="soft" />
          <QuickAction
            to="/partner/citizens"
            search={{ status: "need_documents" }}
            icon={Inbox}
            label={`Follow-up queue (${s.followUp})`}
            tone="soft"
          />
        </div>

        {allCitizens.length > 0 && (
          <div className="mt-8">
            <PartnerDecisionDashboard citizens={allCitizens} />
          </div>
        )}

        <div className="mt-10 rounded-3xl border border-border/70 bg-card p-6">
          <div className="flex items-end justify-between">
            <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              Recent citizens
            </h2>
            <Link
              to="/partner/citizens"
              className="text-sm font-medium text-[var(--trust)] hover:underline"
            >
              View all →
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-border p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No citizens yet. Start your first intake to see them here.
              </p>
              <Link
                to="/partner/intake"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--trust)] px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                <PlusCircle className="h-4 w-4" />
                Start intake
              </Link>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-border/60">
              {recent.map((c: any) => (
                <li key={c.id}>
                  <Link
                    to="/partner/citizens/$id"
                    params={{ id: c.id }}
                    className="flex items-center justify-between gap-4 py-3 hover:bg-secondary/40 rounded-xl px-2"
                  >
                    <div>
                      <p className="font-medium">{c.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {[c.age && `${c.age}y`, c.gender, c.occupation, c.district].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <StatusBadge status={c.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </PageShell>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-1 text-3xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
        {value}
      </p>
    </div>
  );
}

function QuickAction({
  to,
  search,
  icon: Icon,
  label,
  tone,
}: {
  to: string;
  search?: Record<string, string>;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  tone: "trust" | "saffron" | "soft";
}) {
  const cls =
    tone === "trust"
      ? "bg-[var(--trust)] text-primary-foreground"
      : tone === "saffron"
      ? "bg-[var(--saffron)] text-[color:var(--saffron-foreground,white)]"
      : "bg-card border border-border/70 text-foreground";
  return (
    <Link
      to={to as any}
      search={search as any}
      className={`group flex items-center justify-between gap-3 rounded-2xl p-5 transition hover:-translate-y-0.5 hover:shadow-md ${cls}`}
    >
      <span className="flex items-center gap-3 font-medium">
        <Icon className="h-5 w-5" />
        {label}
      </span>
      <ArrowRight className="h-4 w-4 opacity-70 group-hover:translate-x-0.5 transition-transform" />
    </Link>
  );
}

// StatusBadge lives in src/components/partner-status-badge.tsx and is imported above.