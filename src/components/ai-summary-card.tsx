import { Link } from "@tanstack/react-router";
import { ArrowUpRight, FileWarning, Sparkles, TrendingUp, Users } from "lucide-react";
import type { Recommendation } from "@/lib/rules-engine";

/** Compact benefit estimate parser: pulls first ₹ amount if present, else category-based fallback. */
function estimateBenefit(rec: Recommendation): number {
  const text = (rec.scheme.benefits ?? []).join(" ") + " " + (rec.scheme.summary ?? "");
  const m = text.match(/₹\s?([0-9,]+)/);
  if (m) {
    const n = Number(m[1].replace(/,/g, ""));
    if (!Number.isNaN(n) && n > 0) return Math.min(n, 500000);
  }
  const cat = rec.scheme.category?.toLowerCase() ?? "";
  if (cat.includes("pension")) return 12000;
  if (cat.includes("health") || cat.includes("insurance")) return 50000;
  if (cat.includes("housing")) return 130000;
  if (cat.includes("agriculture") || cat.includes("farmer")) return 6000;
  if (cat.includes("education") || cat.includes("scholar")) return 20000;
  return 8000;
}

export type AiSummary = {
  eligible: number;
  totalBenefits: number;
  highest: Recommendation | null;
  missingDocs: string[];
  applicationsReady: number;
  familyCovered: number;
  opportunity: string | null;
};

export function buildAiSummary(
  recommendations: Recommendation[],
  familyCount: number,
): AiSummary {
  const eligible = recommendations.length;
  const totalBenefits = recommendations.reduce((a, r) => a + estimateBenefit(r), 0);
  const highest = recommendations[0] ?? null;
  const docSet = new Set<string>();
  for (const r of recommendations.slice(0, 5)) {
    for (const d of r.scheme.required_documents ?? []) docSet.add(d);
  }
  const applicationsReady = recommendations.filter(
    (r) => r.confidence === "high" && r.gaps.length === 0,
  ).length;
  const familyCovered = new Set(
    recommendations
      .filter((r) => typeof r.matchedFor !== "string")
      .map((r) => (typeof r.matchedFor === "string" ? "" : r.matchedFor.name)),
  ).size;
  const opportunity =
    recommendations.find((r) => r.gaps.length > 0 && r.confidence !== "low")?.gaps?.[0] ??
    (familyCount === 0 ? "Add family members to unlock more benefits." : null);
  return {
    eligible,
    totalBenefits,
    highest,
    missingDocs: [...docSet].slice(0, 6),
    applicationsReady,
    familyCovered,
    opportunity,
  };
}

export function AiSummaryCard({ summary }: { summary: AiSummary }) {
  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-border/70 bg-card p-6 shadow-sm"
      style={{
        backgroundImage:
          "radial-gradient(120% 60% at 100% 0%, color-mix(in oklch, var(--trust) 12%, transparent), transparent 60%)",
      }}
    >
      <div className="flex items-center gap-3">
        <span
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-primary-foreground"
          style={{ backgroundColor: "var(--trust)" }}
        >
          <Sparkles className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-[var(--saffron)]">
            AI summary
          </p>
          <h2 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            What SAARTHI found for you
          </h2>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Eligible schemes" value={String(summary.eligible)} icon={Sparkles} />
        <Metric
          label="Estimated benefits"
          value={`₹${summary.totalBenefits.toLocaleString("en-IN")}`}
          icon={TrendingUp}
        />
        <Metric label="Applications ready" value={String(summary.applicationsReady)} icon={ArrowUpRight} />
        <Metric label="Family covered" value={String(summary.familyCovered)} icon={Users} />
      </div>

      {summary.highest && (
        <div className="mt-5 rounded-2xl bg-[var(--trust)] p-5 text-primary-foreground">
          <p className="text-xs uppercase tracking-widest opacity-80">Highest priority</p>
          <p className="mt-1 text-lg font-semibold">{summary.highest.scheme.name}</p>
          <p className="mt-1 text-sm opacity-90">{summary.highest.why_recommended}</p>
          <Link
            to="/schemes/$id"
            params={{ id: summary.highest.scheme.id }}
            className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium hover:bg-white/25"
          >
            See how to claim
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
          <p className="flex items-center gap-2 text-sm font-medium">
            <FileWarning className="h-4 w-4 text-[var(--saffron)]" />
            Documents you may need
          </p>
          {summary.missingDocs.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No document gaps detected.</p>
          ) : (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {summary.missingDocs.map((d) => (
                <li
                  key={d}
                  className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground"
                >
                  {d}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-2xl border border-dashed border-border p-4">
          <p className="text-sm font-medium">Opportunity unlock</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {summary.opportunity
              ? `Share ${summary.opportunity} — it could unlock stronger matches instantly.`
              : "Your profile looks strong. Keep it updated as life changes."}
          </p>
          <Link
            to="/profile"
            className="mt-3 inline-flex text-sm font-medium text-[var(--trust)] underline-offset-4 hover:underline"
          >
            Update profile →
          </Link>
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-1 text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
        {value}
      </p>
    </div>
  );
}