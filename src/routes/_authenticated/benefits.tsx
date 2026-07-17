import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles } from "lucide-react";
import { PageShell } from "@/components/app-shell";
import { SchemeCard } from "@/components/scheme-card";
import { AiSummaryCard, buildAiSummary } from "@/components/ai-summary-card";
import { OpportunityUnlockCard, buildOpportunities } from "@/components/opportunity-unlock";
import { AnalyzingSteps } from "@/components/analyzing-steps";
import { getRecommendations, listFamily } from "@/lib/citizen.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/benefits")({
  head: () => ({
    meta: [{ title: "Your benefits — SAARTHI" }, { name: "description", content: "Personalised welfare schemes you may qualify for." }],
  }),
  component: BenefitsPage,
});

function BenefitsPage() {
  const rec = useServerFn(getRecommendations);
  const fam = useServerFn(listFamily);
  const q = useQuery({ queryKey: ["recommendations"], queryFn: () => rec() });
  const famQ = useQuery({ queryKey: ["family"], queryFn: () => fam() });
  const [analyzing, setAnalyzing] = useState(true);

  useEffect(() => {
    if (!q.isLoading && q.data) {
      const t = setTimeout(() => setAnalyzing(false), 900);
      return () => clearTimeout(t);
    }
  }, [q.isLoading, q.data]);

  const summary =
    q.data?.recommendations && q.data.recommendations.length
      ? buildAiSummary(q.data.recommendations as any, famQ.data?.length ?? 0)
      : null;
  const opportunities =
    q.data?.recommendations && q.data.recommendations.length
      ? buildOpportunities(q.data.recommendations as any)
      : [];

  return (
    <PageShell>
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-[var(--saffron)]">Your benefits</p>
            <h1 className="mt-1 text-3xl font-semibold sm:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
              Schemes you may qualify for
            </h1>
            <p className="mt-2 max-w-xl text-muted-foreground">
              Ranked by how well they match your profile and family. Every card carries a plain-language
              reason and confidence level. Tap any card for the full explanation.
            </p>
          </div>
          {q.data && (
            <div className="rounded-2xl border border-border/70 bg-card px-4 py-3 text-right">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Profile</p>
              <p className="text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                {q.data.completeness}%
              </p>
              <p className="text-xs text-muted-foreground">complete</p>
            </div>
          )}
        </div>

        <div className="mt-8 space-y-6">
          {(q.isLoading || analyzing) && !q.isError && (
            <AnalyzingSteps active={q.isLoading || analyzing} />
          )}
          {q.isError ? (
            <ErrorState onRetry={() => q.refetch()} />
          ) : !analyzing && (q.data?.recommendations?.length ?? 0) === 0 ? (
            <EmptyState />
          ) : !analyzing && q.data ? (
            <>
              {summary && <AiSummaryCard summary={summary} />}
              {opportunities.length > 0 && (
                <OpportunityUnlockCard opportunities={opportunities} />
              )}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {q.data.recommendations.map((r: any, i: number) => (
                  <SchemeCard key={`${r.scheme.id}-${i}`} rec={r} />
                ))}
              </div>
            </>
          ) : null}
        </div>
      </section>
    </PageShell>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card/60 p-12 text-center">
      <span
        className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl text-primary-foreground"
        style={{ backgroundColor: "var(--trust)" }}
      >
        <Sparkles className="h-6 w-6" />
      </span>
      <h2 className="mt-4 text-xl font-semibold">Let's find your benefits</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Tell SAARTHI a little about you — your age, work, and where you live are a great start.
      </p>
      <div className="mt-5 flex justify-center gap-3">
        <Button asChild size="lg" className="h-12 rounded-full px-6">
          <Link to="/assistant">Talk to SAARTHI</Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="h-12 rounded-full px-6">
          <Link to="/profile">Fill profile</Link>
        </Button>
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-3xl border border-border/70 bg-card p-10 text-center">
      <h2 className="text-lg font-semibold">We couldn't load your benefits</h2>
      <p className="mt-2 text-sm text-muted-foreground">Please try again in a moment.</p>
      <Button className="mt-4 rounded-full" onClick={onRetry}>Try again</Button>
    </div>
  );
}