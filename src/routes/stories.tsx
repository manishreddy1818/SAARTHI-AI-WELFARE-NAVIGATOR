import { createFileRoute, Link } from "@tanstack/react-router";
import { Quote } from "lucide-react";
import { PageShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/stories")({
  head: () => ({
    meta: [
      { title: "Citizen stories — SAARTHI" },
      {
        name: "description",
        content:
          "Real journeys of citizens who used SAARTHI to discover and claim the welfare benefits they qualified for.",
      },
      { property: "og:title", content: "Citizen stories — SAARTHI" },
      {
        property: "og:description",
        content:
          "How SAARTHI helps citizens unlock welfare benefits, one conversation at a time.",
      },
    ],
  }),
  component: StoriesPage,
});

const stories = [
  {
    name: "Kamala, 68 · Karnataka",
    unlocked: "Widow pension + free health cover",
    quote:
      "I never knew I could get a monthly pension. SAARTHI spoke to me in Kannada and told me exactly what papers I needed.",
    tag: "Elderly care",
  },
  {
    name: "Ramesh, 34 · Uttar Pradesh",
    unlocked: "Kisan Samman + crop insurance",
    quote:
      "The forms were too much. SAARTHI asked me questions like a friend and helped my whole family register together.",
    tag: "Farmers",
  },
  {
    name: "Priya, 22 · Maharashtra",
    unlocked: "Skill scholarship + laptop grant",
    quote:
      "I was the first in my family to apply. SAARTHI showed me why I qualified and walked me through every step.",
    tag: "Students",
  },
  {
    name: "Salma, 41 · West Bengal",
    unlocked: "Maternity benefit + child nutrition",
    quote:
      "For my third child, I finally got the maternity payment. It felt like someone was truly on my side.",
    tag: "Mothers",
  },
  {
    name: "Arun, 29 · Tamil Nadu",
    unlocked: "Disability aid + housing subsidy",
    quote:
      "Voice made all the difference. I could speak, not type, and SAARTHI understood.",
    tag: "Accessibility",
  },
];

function StoriesPage() {
  return (
    <PageShell>
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-[var(--saffron)]">
            Citizen stories
          </p>
          <h1
            className="mt-3 text-4xl font-semibold sm:text-5xl"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
          >
            Real people. Real benefits.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            A few of the journeys SAARTHI has helped guide. Every recommendation is
            explained, every eligibility reason is shown, every next step is clear.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {stories.map((s) => (
            <article
              key={s.name}
              className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-card p-7 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                  {s.tag}
                </span>
                <Quote className="h-5 w-5 text-[var(--saffron)]" />
              </div>
              <p className="text-base leading-relaxed text-foreground">"{s.quote}"</p>
              <div className="mt-auto border-t border-border/60 pt-4">
                <p className="text-sm font-semibold">{s.name}</p>
                <p className="mt-1 text-sm text-[var(--trust)]">Unlocked: {s.unlocked}</p>
              </div>
            </article>
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