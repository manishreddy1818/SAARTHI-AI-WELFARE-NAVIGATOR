import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, ClipboardList, FileText, Mic, Sparkles, Users } from "lucide-react";
import { PageShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { SchemeCard } from "@/components/scheme-card";
import { useAuth } from "@/hooks/use-auth";
import {
  getRecommendations,
  listApplications,
  listFamily,
  listDocuments,
} from "@/lib/citizen.functions";

export const Route = createFileRoute("/_authenticated/citizen")({
  head: () => ({
    meta: [
      { title: "Your dashboard — SAARTHI" },
      { name: "description", content: "Your citizen dashboard on SAARTHI." },
    ],
  }),
  component: CitizenDashboard,
});

function CitizenDashboard() {
  const { user } = useAuth();
  const name = (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ?? "friend";
  const rec = useServerFn(getRecommendations);
  const listApp = useServerFn(listApplications);
  const listFam = useServerFn(listFamily);
  const listDoc = useServerFn(listDocuments);
  const recsQ = useQuery({ queryKey: ["recommendations"], queryFn: () => rec(), staleTime: 60_000 });
  const appsQ = useQuery({ queryKey: ["applications"], queryFn: () => listApp(), staleTime: 60_000 });
  const famQ = useQuery({ queryKey: ["family"], queryFn: () => listFam(), staleTime: 60_000 });
  const docsQ = useQuery({ queryKey: ["documents"], queryFn: () => listDoc(), staleTime: 60_000 });

  const completeness = recsQ.data?.completeness ?? 0;
  const topRecs = (recsQ.data?.recommendations ?? []).slice(0, 3);
  const activeApps = (appsQ.data ?? []).filter((a: any) => a.status !== "rejected").length;

  return (
    <PageShell>
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Namaste
          </p>
          <h1
            className="text-3xl font-semibold sm:text-4xl"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}
          >
            Welcome, {name}.
          </h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Here's your welfare journey — your assistant, your matches, your family, and your paperwork.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr,1fr]">
          <div className="rounded-3xl bg-[var(--trust)] p-8 text-primary-foreground shadow-lg">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                <Mic className="h-5 w-5" />
              </span>
              <p className="text-lg font-semibold">Talk to SAARTHI</p>
            </div>
            <p className="mt-4 text-primary-foreground/85">
              Ask about pensions, farmer schemes, housing, health, scholarships, or anything you need.
              I'll listen — in your language — and update your profile as we go.
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-6 h-12 rounded-full px-6">
              <Link to="/assistant">Start a conversation <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>

          <div className="rounded-3xl border border-border/70 bg-card p-6">
            <p className="text-sm uppercase tracking-widest text-muted-foreground">Profile</p>
            <p className="mt-2 text-4xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>{completeness}%</p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-[var(--trust)] transition-all" style={{ width: `${completeness}%` }} />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              The more we know, the sharper your recommendations get.
            </p>
            <Button asChild size="sm" variant="outline" className="mt-4 rounded-full">
              <Link to="/profile">Edit profile</Link>
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <StatCard label="Family" value={String(famQ.data?.length ?? 0)} icon={Users} to="/family" />
          <StatCard label="Documents" value={String(docsQ.data?.length ?? 0)} icon={FileText} to="/documents" />
          <StatCard label="Applications" value={String(activeApps)} icon={ClipboardList} to="/applications" />
        </div>

        <div className="mt-10">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                Top matches for you
              </h2>
              <p className="text-sm text-muted-foreground">Personalised, explained, ready to unlock.</p>
            </div>
            <Button asChild variant="ghost" size="sm" className="rounded-full">
              <Link to="/benefits">See all <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>
          {topRecs.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card/60 p-10 text-center">
              <Sparkles className="mx-auto h-6 w-6 text-[var(--saffron)]" />
              <p className="mt-3 font-medium">Let's find your first match</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                Share a little about yourself with SAARTHI and personalised schemes will show up here.
              </p>
              <Button asChild className="mt-4 rounded-full"><Link to="/assistant">Talk to SAARTHI</Link></Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {topRecs.map((r: any, i: number) => <SchemeCard key={`${r.scheme.id}-${i}`} rec={r} />)}
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}

function StatCard({
  label, value, icon: Icon, to,
}: { label: string; value: string; icon: React.ComponentType<{ className?: string }>; to: string }) {
  return (
    <Link
      to={to}
      className="group flex items-center justify-between rounded-2xl border border-border/70 bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="mt-1 text-3xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>{value}</p>
      </div>
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-[var(--trust)] group-hover:bg-[var(--trust)] group-hover:text-primary-foreground transition-colors">
        <Icon className="h-5 w-5" />
      </span>
    </Link>
  );
}