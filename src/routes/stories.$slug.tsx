import { useEffect, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  FileText,
  MapPin,
  MessageCircle,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  UserCircle,
} from "lucide-react";
import { PageShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { findJourney, type JourneyStep } from "@/lib/journeys";

export const Route = createFileRoute("/stories/$slug")({
  loader: ({ params }) => {
    const j = findJourney(params.slug);
    if (!j) throw notFound();
    return j;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [] };
    return {
      meta: [
        { title: `${loaderData.name} — SAARTHI journey` },
        { name: "description", content: loaderData.tagline },
        { property: "og:title", content: `${loaderData.name} · SAARTHI Journey` },
        { property: "og:description", content: loaderData.tagline },
      ],
    };
  },
  notFoundComponent: () => (
    <PageShell>
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold">Journey not found</h1>
        <p className="mt-2 text-muted-foreground">The story you're looking for isn't here.</p>
        <Button asChild className="mt-6 rounded-full">
          <Link to="/stories">Back to stories</Link>
        </Button>
      </div>
    </PageShell>
  ),
  errorComponent: () => (
    <PageShell>
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold">Couldn't load this journey</h1>
        <Button asChild className="mt-6 rounded-full">
          <Link to="/stories">All stories</Link>
        </Button>
      </div>
    </PageShell>
  ),
  component: JourneyPage,
});

function JourneyPage() {
  const j = Route.useLoaderData();
  const [playing, setPlaying] = useState(true);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!playing) return;
    if (step >= j.steps.length) return;
    const t = setTimeout(() => setStep((s) => Math.min(j.steps.length, s + 1)), 1400);
    return () => clearTimeout(t);
  }, [step, playing, j.steps.length]);

  function reset() {
    setStep(0);
    setPlaying(true);
  }

  return (
    <PageShell>
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <Link
          to="/stories"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          All journeys
        </Link>

        <div className="rounded-3xl bg-[var(--trust)] p-8 text-primary-foreground shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-5xl" aria-hidden>
                {j.emoji}
              </span>
              <div>
                <p className="text-xs uppercase tracking-widest opacity-80">{j.role}</p>
                <h1
                  className="text-3xl font-semibold sm:text-4xl"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {j.name}
                </h1>
                <p className="mt-1 text-sm opacity-90 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {j.location} · Speaks {j.language}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPlaying((p) => !p)}
                className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium hover:bg-white/25"
              >
                {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {playing ? "Pause" : "Play"}
              </button>
              <button
                onClick={reset}
                className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium hover:bg-white/25"
              >
                <RotateCcw className="h-4 w-4" />
                Replay
              </button>
            </div>
          </div>
          <p className="mt-6 text-lg italic opacity-95">"{j.hero}"</p>
        </div>

        <div className="mt-8 space-y-4">
          {j.steps.slice(0, step + 1).map((s, i) => (
            <StepBlock key={i} step={s} index={i} />
          ))}
          {step < j.steps.length - 1 && playing && (
            <div className="rounded-2xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
              …unfolding
            </div>
          )}
        </div>

        <div className="mt-10 flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-muted-foreground">
            Every SAARTHI journey is explainable. Real schemes. Real reasons. Real outcomes.
          </p>
          <Button asChild size="lg" className="rounded-full">
            <Link to="/role-select">Start your own</Link>
          </Button>
        </div>
      </section>
    </PageShell>
  );
}

function StepBlock({ step, index }: { step: JourneyStep; index: number }) {
  const base =
    "rounded-3xl border border-border/70 bg-card p-5 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500";

  switch (step.kind) {
    case "conversation":
      return (
        <div className={base}>
          <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">
            {index === 0 ? "Conversation begins" : "Conversation"}
          </p>
          <div
            className={`flex gap-3 ${
              step.speaker === "citizen" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                step.speaker === "citizen"
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-[var(--trust)] text-primary-foreground"
              }`}
            >
              <p className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-widest opacity-70">
                {step.speaker === "citizen" ? (
                  <>
                    <UserCircle className="h-3 w-3" /> Citizen
                  </>
                ) : (
                  <>
                    <MessageCircle className="h-3 w-3" /> SAARTHI
                  </>
                )}
              </p>
              {step.text}
            </div>
          </div>
        </div>
      );
    case "profile":
      return (
        <div className={base}>
          <p className="text-xs uppercase tracking-widest text-[var(--saffron)]">Profile built</p>
          <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {step.facts.map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-secondary/60 px-3 py-2">
                <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">{k}</dt>
                <dd className="text-sm font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      );
    case "recommendations":
      return (
        <div className={base}>
          <p className="text-xs uppercase tracking-widest text-[var(--saffron)]">Recommended schemes</p>
          <ul className="mt-3 space-y-2">
            {step.items.map((r) => (
              <li
                key={r.name}
                className="flex items-start gap-3 rounded-2xl border border-border/60 p-3"
              >
                <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--trust)]" />
                <div>
                  <p className="font-semibold">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.why}</p>
                  <p className="mt-1 text-xs font-medium text-[var(--trust)]">{r.benefit}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      );
    case "documents":
      return (
        <div className={base}>
          <p className="text-xs uppercase tracking-widest text-[var(--saffron)]">Documents needed</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {step.items.map((d) => (
              <li
                key={d}
                className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
              >
                <FileText className="h-3 w-3" />
                {d}
              </li>
            ))}
          </ul>
        </div>
      );
    case "guidance":
      return (
        <div className={base}>
          <p className="text-xs uppercase tracking-widest text-[var(--saffron)]">Application guidance</p>
          <ol className="mt-3 space-y-2">
            {step.steps.map((g, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-[var(--trust)]" />
                {g}
              </li>
            ))}
          </ol>
        </div>
      );
    case "outcome":
      return (
        <div
          className="rounded-3xl border border-[var(--saffron)]/30 p-6 shadow-sm"
          style={{ backgroundColor: "color-mix(in oklch, var(--saffron) 10%, var(--card))" }}
        >
          <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-[var(--saffron)]">
            <Trophy className="h-4 w-4" /> Outcome
          </p>
          <p className="mt-2 text-base">{step.text}</p>
          <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-[var(--trust)] px-3 py-1.5 text-sm font-semibold text-primary-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            Unlocked: {step.unlocked}
          </p>
        </div>
      );
  }
}