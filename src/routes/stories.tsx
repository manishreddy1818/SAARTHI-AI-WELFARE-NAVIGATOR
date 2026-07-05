import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, PlayCircle } from "lucide-react";
import { PageShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { JOURNEYS } from "@/lib/journeys";

export const Route = createFileRoute("/stories")({
  head: () => ({
    meta: [
      { title: "Real citizen journeys — SAARTHI" },
      {
        name: "description",
        content:
          "Replayable journeys of citizens across India who used SAARTHI to discover and claim welfare benefits.",
      },
      { property: "og:title", content: "Real Citizen Journeys — SAARTHI" },
      {
        property: "og:description",
        content:
          "Replayable, explainable journeys — from conversation to profile to unlocked benefits.",
      },
    ],
  }),
  component: StoriesPage,
});

function StoriesPage() {
  return (
    <PageShell>
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-[var(--saffron)]">
            Real Citizen Journeys
          </p>
          <h1
            className="mt-3 text-4xl font-semibold sm:text-5xl"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
          >
            Real people. Real benefits. Replayable.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Walk through the exact conversation, profile, recommendations and outcome for each
            citizen. Every reason is shown. Every next step is clear.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {JOURNEYS.map((j) => (
            <Link
              key={j.slug}
              to="/stories/$slug"
              params={{ slug: j.slug }}
              className="group flex flex-col rounded-3xl border border-border/70 bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-4xl" aria-hidden>
                  {j.emoji}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                  <PlayCircle className="h-3.5 w-3.5" />
                  Replay
                </span>
              </div>
              <p className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">
                {j.role} · {j.location}
              </p>
              <h3 className="mt-1 text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                {j.name}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{j.tagline}</p>
              <p className="mt-4 rounded-2xl bg-secondary/60 px-3 py-2 text-sm italic">
                "{j.hero}"
              </p>
              <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-medium text-[var(--trust)] group-hover:translate-x-0.5 transition-transform">
                Watch journey <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <Button asChild size="lg" className="h-14 rounded-full px-8 text-base">
            <Link to="/role-select">Start your own journey</Link>
          </Button>
        </div>
      </section>
    </PageShell>
  );
}