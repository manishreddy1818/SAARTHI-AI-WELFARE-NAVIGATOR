import { Link } from "@tanstack/react-router";
import { Sparkles, TrendingUp, ArrowRight } from "lucide-react";
import type { Recommendation } from "@/lib/rules-engine";

/** Shared benefit-estimate heuristic (mirrors AiSummaryCard/HouseholdSummary). */
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

export type Opportunity = {
  gap: string;
  schemes: Recommendation[];
  count: number;
  estimatedGain: number;
  topScheme: Recommendation;
  /** Higher confidence buckets unlock a stronger promise. */
  confidenceBoost: "high" | "medium" | "low";
};

/**
 * Group current recommendations by their gap strings.
 * A gap that appears across many high-confidence, high-benefit schemes ranks first —
 * fixing it unlocks the most welfare with the least user effort.
 */
export function buildOpportunities(
  recommendations: Recommendation[],
  limit = 4,
): Opportunity[] {
  const groups = new Map<string, Recommendation[]>();
  for (const r of recommendations) {
    for (const g of r.gaps ?? []) {
      const key = g.trim();
      if (!key) continue;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(r);
    }
  }

  const opportunities: Opportunity[] = [];
  for (const [gap, schemes] of groups) {
    if (schemes.length === 0) continue;
    const estimatedGain = schemes.reduce((a, r) => a + estimateBenefit(r), 0);
    const top = [...schemes].sort((a, b) => b.score - a.score)[0]!;
    const highs = schemes.filter((s) => s.confidence === "high").length;
    const meds = schemes.filter((s) => s.confidence === "medium").length;
    const confidenceBoost: Opportunity["confidenceBoost"] =
      highs > 0 ? "high" : meds > 0 ? "medium" : "low";
    opportunities.push({
      gap,
      schemes,
      count: schemes.length,
      estimatedGain,
      topScheme: top,
      confidenceBoost,
    });
  }

  // Impact = schemes affected weighted by estimated gain and confidence.
  const weight = { high: 1.15, medium: 1.0, low: 0.85 } as const;
  opportunities.sort(
    (a, b) =>
      b.count * weight[b.confidenceBoost] * (1 + Math.log10(1 + b.estimatedGain)) -
      a.count * weight[a.confidenceBoost] * (1 + Math.log10(1 + a.estimatedGain)),
  );

  return opportunities.slice(0, limit);
}

/** Map a raw gap phrase to the profile field that resolves it. */
function gapToAction(gap: string): { label: string; hint: string } {
  const g = gap.toLowerCase();
  if (g.includes("age")) return { label: "Add your age", hint: "Takes 5 seconds" };
  if (g.includes("gender")) return { label: "Set gender", hint: "One tap" };
  if (g.includes("occupation"))
    return { label: "Tell us your occupation", hint: "Farmer, worker, student, etc." };
  if (g.includes("income"))
    return { label: "Add household income", hint: "Approximate is fine" };
  if (g.includes("social category"))
    return { label: "Set social category", hint: "General / OBC / SC / ST / Minority" };
  if (g.includes("marital")) return { label: "Add marital status", hint: "One tap" };
  if (g.includes("rural") || g.includes("urban"))
    return { label: "Rural or urban household?", hint: "One tap" };
  if (g.includes("family") || g.includes("member"))
    return { label: "Add family members", hint: "Unlocks per-person benefits" };
  if (g.includes("document"))
    return { label: "Upload the missing document", hint: "Boosts confidence" };
  return { label: `Add ${gap}`, hint: "Improves your match" };
}

export function OpportunityUnlockCard({
  opportunities,
}: {
  opportunities: Opportunity[];
}) {
  if (opportunities.length === 0) return null;
  return (
    <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <span
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-primary-foreground"
          style={{ backgroundColor: "var(--saffron)" }}
        >
          <TrendingUp className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-[var(--saffron)]">
            Smart opportunity unlock
          </p>
          <h2 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            Small updates → big unlocks
          </h2>
        </div>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        These quick profile updates would strengthen the most matches right now.
      </p>

      <ul className="mt-5 grid gap-3 md:grid-cols-2">
        {opportunities.map((o) => {
          const action = gapToAction(o.gap);
          return (
            <li
              key={o.gap}
              className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-background/60 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{action.label}</p>
                  <p className="text-xs text-muted-foreground">{action.hint}</p>
                </div>
                <span
                  className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                  style={{
                    backgroundColor: "color-mix(in oklch, var(--trust) 12%, transparent)",
                    color: "var(--trust)",
                  }}
                >
                  <Sparkles className="h-3 w-3" />
                  +{o.count} match{o.count === 1 ? "" : "es"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  Est. unlock ≈{" "}
                  <span className="font-semibold text-foreground">
                    ₹{o.estimatedGain.toLocaleString("en-IN")}
                  </span>
                </p>
                <Link
                  to="/profile"
                  className="inline-flex items-center gap-1 text-xs font-medium text-[var(--trust)] underline-offset-4 hover:underline"
                >
                  Update <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <p className="text-xs text-muted-foreground">
                Top scheme affected:{" "}
                <Link
                  to="/schemes/$id"
                  params={{ id: o.topScheme.scheme.id }}
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  {o.topScheme.scheme.short_name ?? o.topScheme.scheme.name}
                </Link>
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}