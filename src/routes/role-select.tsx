import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, HandHeart, User } from "lucide-react";
import { PageShell } from "@/components/app-shell";

export const Route = createFileRoute("/role-select")({
  head: () => ({
    meta: [
      { title: "Choose your journey — SAARTHI" },
      {
        name: "description",
        content:
          "Are you here for yourself or your family, or as a welfare partner helping citizens? Pick your journey to continue.",
      },
    ],
  }),
  component: RoleSelect,
});

function RoleSelect() {
  return (
    <PageShell>
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h1
            className="text-3xl font-semibold sm:text-5xl"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
          >
            How will you use SAARTHI?
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            You can switch anytime. Pick the journey that fits you now.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <JourneyCard
            to="/auth"
            search={{ role: "citizen" }}
            icon={User}
            title="I am a citizen"
            body="Discover welfare schemes and benefits you or your family qualify for. Talk to SAARTHI in your language."
            cta="Continue as citizen"
            accent="var(--trust)"
          />
          <JourneyCard
            to="/auth"
            search={{ role: "partner" }}
            icon={HandHeart}
            title="I am a welfare partner"
            body="Help citizens claim benefits faster. Manage intakes, track impact, and coordinate follow-ups."
            cta="Continue as partner"
            accent="var(--saffron)"
          />
        </div>
      </section>
    </PageShell>
  );
}

function JourneyCard({
  to,
  search,
  icon: Icon,
  title,
  body,
  cta,
  accent,
}: {
  to: string;
  search: Record<string, string>;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  cta: string;
  accent: string;
}) {
  return (
    <Link
      to={to}
      search={search as never}
      className="group relative flex flex-col gap-6 overflow-hidden rounded-3xl border border-border/70 bg-card p-8 transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
    >
      <span
        className="inline-flex h-14 w-14 items-center justify-center rounded-2xl text-primary-foreground"
        style={{ backgroundColor: accent }}
      >
        <Icon className="h-7 w-7" />
      </span>
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
          {title}
        </h2>
        <p className="text-base text-muted-foreground">{body}</p>
      </div>
      <span className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-[var(--trust)]">
        {cta}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  );
}