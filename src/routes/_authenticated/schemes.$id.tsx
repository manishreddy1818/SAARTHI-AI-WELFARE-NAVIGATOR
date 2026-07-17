import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  BadgeCheck,
  Bookmark,
  BookmarkCheck,
  Check,
  ExternalLink,
  FileText,
  Loader2,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { PageShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { getScheme, getRecommendations, toggleSaved, listSaved, upsertApplication } from "@/lib/citizen.functions";
import type { Recommendation, ExplanationEnvelope } from "@/lib/rules-engine";
import { buildEnvelope, envelopeFromRecommendation } from "@/lib/rules-engine";
import { ActionPlanCard } from "@/components/action-plan";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/schemes/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.id} — SAARTHI` },
      { name: "description", content: "Full scheme details with eligibility explanation and next steps." },
    ],
  }),
  component: SchemeDetail,
});

function SchemeDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const [unlocked, setUnlocked] = useState(false);

  const getS = useServerFn(getScheme);
  const getRec = useServerFn(getRecommendations);
  const toggle = useServerFn(toggleSaved);
  const listSv = useServerFn(listSaved);
  const upsertApp = useServerFn(upsertApplication);

  const schemeQ = useQuery({ queryKey: ["scheme", id], queryFn: () => getS({ data: { id } }) });
  const recQ = useQuery({ queryKey: ["recommendations"], queryFn: () => getRec() });
  const savedQ = useQuery({ queryKey: ["saved"], queryFn: () => listSv() });

  const rec = useMemo<Recommendation | undefined>(() => {
    const list = recQ.data?.recommendations ?? [];
    return list.find((r: any) => r.scheme.id === id) as Recommendation | undefined;
  }, [recQ.data, id]);

  // Explanation envelope: use the recommendation when available, otherwise
  // build one deterministically from the current profile so the reasoning
  // panels are never empty on direct scheme visits.
  const envelope = useMemo<ExplanationEnvelope | undefined>(() => {
    if (rec) return envelopeFromRecommendation(rec);
    if (schemeQ.data && recQ.data?.profile) {
      return buildEnvelope(schemeQ.data, recQ.data.profile as any);
    }
    return undefined;
  }, [rec, schemeQ.data, recQ.data]);

  const isSaved = (savedQ.data ?? []).includes(id);

  const toggleMut = useMutation({
    mutationFn: () => toggle({ data: { scheme_id: id } }),
    onSuccess: (res) => {
      toast.success(res.saved ? "Saved to your list." : "Removed from your list.");
      qc.invalidateQueries({ queryKey: ["saved"] });
    },
  });

  const unlockMut = useMutation({
    mutationFn: () => upsertApp({ data: { scheme_id: id, status: "in_progress" } }),
    onSuccess: () => {
      setUnlocked(true);
      qc.invalidateQueries({ queryKey: ["applications"] });
      qc.invalidateQueries({ queryKey: ["action-plan", id] });
      toast.success("Opportunity unlocked. Steps saved to Applications.");
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not unlock."),
  });

  if (schemeQ.isLoading) {
    return (
      <PageShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }
  if (!schemeQ.data) {
    return (
      <PageShell>
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold">Scheme not found</h1>
          <Button asChild className="mt-4"><Link to="/benefits">Back to benefits</Link></Button>
        </div>
      </PageShell>
    );
  }

  const s = schemeQ.data;
  const confidence = envelope?.confidence ?? "medium";
  const conf_color = confidence === "high" ? "var(--success)" : confidence === "medium" ? "var(--saffron)" : "var(--muted-foreground)";

  return (
    <PageShell>
      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Link to="/benefits" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to benefits
        </Link>

        <header className="mt-4 rounded-3xl border border-border/70 bg-card p-8 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <span className="inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground capitalize">
                {s.category} · {s.level}
              </span>
              <h1 className="mt-3 text-3xl font-semibold sm:text-4xl" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}>
                {s.name}
              </h1>
              {s.short_name && <p className="mt-1 text-sm text-muted-foreground">{s.short_name}</p>}
              <p className="mt-4 text-lg text-muted-foreground">{s.summary}</p>
            </div>
            {envelope && (
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium"
                style={{ color: conf_color, backgroundColor: `color-mix(in oklch, ${conf_color} 15%, transparent)` }}
              >
                <BadgeCheck className="h-4 w-4" />
                {confidence === "high" ? "High match" : confidence === "medium" ? "Good match" : "Possible match"}
              </span>
            )}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <BenefitsBox items={s.benefits} />
            <MinistryBox ministry={s.ministry} url={s.official_url} />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {!unlocked ? (
              <Button
                size="lg"
                className="h-12 rounded-full px-6"
                onClick={() => unlockMut.mutate()}
                disabled={unlockMut.isPending}
              >
                {unlockMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Unlock this opportunity
              </Button>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full bg-[color-mix(in_oklch,var(--success)_18%,transparent)] px-4 py-2 text-sm font-medium text-[var(--success)]">
                <Check className="h-4 w-4" /> Opportunity unlocked · added to Applications
              </span>
            )}
            <Button
              variant="outline"
              size="lg"
              className="h-12 rounded-full px-6"
              onClick={() => toggleMut.mutate()}
              disabled={toggleMut.isPending}
            >
              {isSaved ? <BookmarkCheck className="mr-2 h-4 w-4" /> : <Bookmark className="mr-2 h-4 w-4" />}
              {isSaved ? "Saved" : "Save for later"}
            </Button>
            <Button
              asChild
              variant="ghost"
              size="lg"
              className="h-12 rounded-full px-6"
            >
              <a href={s.official_url} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Official portal
              </a>
            </Button>
          </div>
        </header>

        {/* Explanation Envelope */}
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Envelope title="Why we recommended this" icon={Sparkles} accent="var(--saffron)">
            <p className="text-sm">{envelope?.why_recommended ?? "This scheme fits the category of support you may need."}</p>
          </Envelope>

          <Envelope title="Confidence" icon={BadgeCheck} accent={conf_color}>
            <p className="text-sm capitalize">
              <span className="font-semibold" style={{ color: conf_color }}>{confidence}</span>{" "}
              — {confidence === "high"
                ? "You match all critical criteria we know about."
                : confidence === "medium"
                ? "You match most criteria; a few details would confirm eligibility."
                : "You may qualify — a few facts are missing."}
            </p>
            {envelope && envelope.gaps.length > 0 && (
              <div className="mt-3 rounded-xl bg-muted/60 p-3 text-xs">
                <p className="font-medium text-foreground">To increase confidence, share:</p>
                <ul className="mt-1 list-disc pl-4 text-muted-foreground">
                  {envelope.gaps.map((g) => <li key={g}>{g}</li>)}
                </ul>
              </div>
            )}
          </Envelope>

          <Envelope title="Why you are eligible" icon={ShieldCheck} accent="var(--trust)" wide>
            {envelope ? (
              <ul className="space-y-2 text-sm">
                {envelope.why_eligible.map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span
                      className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full ${
                        r.passed ? "bg-[color-mix(in_oklch,var(--success)_18%,transparent)] text-[var(--success)]" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {r.passed ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                    </span>
                    <span>
                      <span className="font-medium">{r.label}</span>
                      {r.note && <span className="text-muted-foreground"> — {r.note}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Complete your profile to see personalised eligibility reasoning.</p>
            )}
          </Envelope>

          <Envelope title="Required documents" icon={FileText} accent="var(--trust)">
            <ul className="space-y-2 text-sm">
              {(s.required_documents ?? []).map((d: string) => (
                <li key={d} className="flex items-start gap-2">
                  <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  {d}
                </li>
              ))}
            </ul>
          </Envelope>

          <Envelope title="Next step" icon={Sparkles} accent="var(--saffron)">
            <p className="text-sm">{s.next_step}</p>
          </Envelope>

          <Envelope title="Trust note" icon={ShieldCheck} accent="var(--success)" wide>
            <p className="text-sm">
              {s.trust_note ?? "Details verified against the official government source. Always cross-check on the ministry portal before applying."}
              {" "}
              <a href={s.official_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-[var(--trust)] hover:underline">
                Official source <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </Envelope>
        </div>

        <div className="mt-6">
          <ActionPlanCard schemeId={id} />
        </div>
      </section>
    </PageShell>
  );
}

function Envelope({
  title,
  icon: Icon,
  accent,
  wide,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-3xl border border-border/70 bg-card p-6 ${wide ? "lg:col-span-2" : ""}`}>
      <div className="flex items-center gap-2">
        <span
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ backgroundColor: `color-mix(in oklch, ${accent} 15%, transparent)`, color: accent }}
        >
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      </div>
      <div className="mt-3 text-foreground">{children}</div>
    </div>
  );
}

function BenefitsBox({ items }: { items: string[] }) {
  return (
    <div className="rounded-2xl bg-secondary/60 p-5">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">What you get</p>
      <ul className="mt-2 space-y-1.5 text-sm">
        {items?.map((b: string) => (
          <li key={b} className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 text-[var(--success)]" />
            {b}
          </li>
        ))}
      </ul>
    </div>
  );
}

function MinistryBox({ ministry, url }: { ministry?: string | null; url: string }) {
  return (
    <div className="rounded-2xl border border-border/70 p-5">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Official source</p>
      <p className="mt-2 text-sm">{ministry ?? "Government of India"}</p>
      <a href={url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 break-all text-xs text-[var(--trust)] hover:underline">
        {url} <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}