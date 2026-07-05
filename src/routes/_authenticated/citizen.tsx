import { createFileRoute, Link } from "@tanstack/react-router";
import { Mic, Sparkles, FileText, Users, Bell } from "lucide-react";
import { PageShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

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
  return (
    <PageShell>
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
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
            Your SAARTHI is ready. Start a short conversation and we'll begin matching
            you to the welfare benefits you may qualify for.
          </p>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-[1.3fr,1fr]">
          <div className="rounded-3xl border border-border/70 bg-card p-8 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--trust)] text-primary-foreground">
                <Mic className="h-5 w-5" />
              </span>
              <div>
                <p className="text-lg font-semibold">Talk to SAARTHI</p>
                <p className="text-sm text-muted-foreground">Voice or text · Your language</p>
              </div>
            </div>
            <p className="mt-6 text-base text-muted-foreground">
              We'll ask a few gentle questions about you and your family so we can find
              the schemes that fit best. You can stop anytime.
            </p>
            <Button size="lg" className="mt-6 h-14 rounded-full px-8 text-base" disabled>
              <Sparkles className="mr-2 h-5 w-5" />
              Start conversation
              <span className="ml-3 rounded-full bg-primary-foreground/15 px-2 py-0.5 text-xs">
                Coming next
              </span>
            </Button>
          </div>

          <EmptyPanel
            icon={Sparkles}
            title="Your benefits will appear here"
            body="Once you share a little about yourself, your personalised feed of eligible schemes will show up right here — with a clear reason for each."
          />
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          <QuickCard icon={FileText} title="Documents" body="Keep your Aadhaar, ration card, and income proof close." />
          <QuickCard icon={Users} title="Family" body="Add family members so we can help each of them too." />
          <QuickCard icon={Bell} title="Updates" body="We'll gently remind you about deadlines and renewals." />
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Prefer to explore first?{" "}
          <Link to="/stories" className="text-[var(--trust)] hover:underline">
            See how other citizens use SAARTHI
          </Link>
        </p>
      </section>
    </PageShell>
  );
}

function EmptyPanel({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col items-start gap-4 rounded-3xl border border-dashed border-border bg-card/60 p-8">
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

function QuickCard({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-[var(--trust)]">
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-3 font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}