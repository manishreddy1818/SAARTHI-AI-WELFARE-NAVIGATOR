import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Mic, ShieldCheck, Sparkles, Users } from "lucide-react";
import { PageShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/brand";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <PageShell>
      <Hero />
      <TrustStrip />
      <HowItWorks />
      <ClosingCTA />
    </PageShell>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(60% 50% at 20% 10%, oklch(0.78 0.16 65 / 0.18), transparent 70%), radial-gradient(50% 40% at 90% 20%, oklch(0.55 0.14 265 / 0.15), transparent 70%)",
        }}
      />
      <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 md:grid-cols-[1.15fr,1fr] md:py-28">
        <div className="flex flex-col justify-center gap-6">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-[var(--saffron)]" />
            Voice-first welfare companion
          </span>
          <h1
            className="text-4xl font-semibold leading-tight text-foreground sm:text-5xl md:text-6xl"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
          >
            Every citizen deserves the benefits they qualify for.
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            SAARTHI is a warm, patient AI guide that talks with you in your language,
            understands your situation, and connects you to the government schemes and
            welfare programmes you are truly eligible for.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button asChild size="lg" className="h-14 rounded-full px-8 text-base">
              <Link to="/role-select">
                Start your journey <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-14 rounded-full px-8 text-base"
            >
              <Link to="/stories">See citizen stories</Link>
            </Button>
          </div>
          <p className="flex items-center gap-2 pt-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-[var(--success)]" />
            Your data stays private. Every recommendation is explained.
          </p>
        </div>
        <div className="relative flex items-center justify-center">
          <div className="relative w-full max-w-md rounded-3xl border border-border/70 bg-card p-6 shadow-xl">
            <div className="flex items-center gap-3 border-b border-border/60 pb-4">
              <BrandMark size={44} />
              <div>
                <p className="text-sm font-semibold">SAARTHI</p>
                <p className="text-xs text-muted-foreground">Listening in your language</p>
              </div>
              <span className="ml-auto inline-flex h-2.5 w-2.5 rounded-full bg-[var(--success)]" />
            </div>
            <div className="mt-5 space-y-4">
              <ChatBubble role="user">
                My mother is 68 and lives alone. What can help her?
              </ChatBubble>
              <ChatBubble role="ai">
                I can help. Based on what you shared, she may qualify for a monthly
                pension and free medical cover. Shall I walk you through it?
              </ChatBubble>
              <div className="flex items-center gap-3 rounded-2xl bg-secondary px-4 py-3">
                <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--trust)] text-primary-foreground">
                  <Mic className="h-5 w-5" />
                  <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[var(--trust)]/40" />
                </span>
                <span className="text-sm text-muted-foreground">
                  Tap to speak · or type your reply
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ChatBubble({ role, children }: { role: "user" | "ai"; children: React.ReactNode }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-[var(--trust)] text-primary-foreground"
            : "bg-secondary text-secondary-foreground"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function TrustStrip() {
  const items = [
    { icon: Mic, title: "Voice-first", body: "Speak naturally in your language. No forms to fill." },
    { icon: ShieldCheck, title: "Explainable", body: "Every recommendation shows why and how you qualify." },
    { icon: Users, title: "Human handoff", body: "Welfare partners help you finish the last mile." },
  ];
  return (
    <section className="border-y border-border/70 bg-card/60">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-3 sm:px-6">
        {items.map((it) => (
          <div key={it.title} className="flex items-start gap-4">
            <span className="mt-1 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-[var(--trust)]">
              <it.icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-base font-semibold">{it.title}</p>
              <p className="text-sm text-muted-foreground">{it.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", title: "Tell SAARTHI about you", body: "A short, friendly conversation — by voice or text — in your language." },
    { n: "02", title: "See what you qualify for", body: "A clear feed of schemes with plain-language eligibility and next steps." },
    { n: "03", title: "Get help to claim", body: "Guided applications and, when needed, a welfare partner by your side." },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2
          className="text-3xl font-semibold sm:text-4xl"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}
        >
          How SAARTHI works
        </h2>
        <p className="mt-3 text-muted-foreground">
          Three simple steps from a conversation to a benefit in your hands.
        </p>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {steps.map((s) => (
          <div key={s.n} className="rounded-2xl border border-border/70 bg-card p-6">
            <p className="text-sm font-semibold text-[var(--saffron)]">{s.n}</p>
            <p className="mt-2 text-lg font-semibold">{s.title}</p>
            <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ClosingCTA() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      <div className="rounded-3xl bg-[var(--trust)] px-8 py-14 text-center text-primary-foreground shadow-lg sm:px-14">
        <h2
          className="text-3xl font-semibold sm:text-4xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Ready when you are.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-primary-foreground/85">
          Pick your journey — are you here for yourself or your family, or do you help
          citizens as a welfare partner?
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" variant="secondary" className="h-14 rounded-full px-8 text-base">
            <Link to="/role-select">Choose your journey</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
