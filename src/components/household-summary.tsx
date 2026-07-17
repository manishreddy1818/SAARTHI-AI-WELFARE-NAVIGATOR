import { Link } from "@tanstack/react-router";
import { Home, Sparkles, TrendingUp, Users } from "lucide-react";
import type { Recommendation } from "@/lib/rules-engine";

/** Same benefit-estimate heuristic used by AiSummaryCard. Kept private to avoid coupling. */
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

export type PersonBucket = {
  key: string;
  label: string;
  sublabel: string;
  count: number;
  benefits: number;
  top: Recommendation | null;
  categories: string[];
};

export type HouseholdSummary = {
  people: PersonBucket[];
  totalBenefits: number;
  totalEligible: number;
  coveragePct: number; // members with ≥1 match / total members (self+family)
};

export function buildHouseholdSummary(
  recommendations: Recommendation[],
  family: { id: string; name: string; relationship?: string | null; age?: number | null }[],
  selfName = "You",
): HouseholdSummary {
  const buckets = new Map<string, PersonBucket>();
  const ensure = (key: string, label: string, sublabel: string) => {
    if (!buckets.has(key))
      buckets.set(key, { key, label, sublabel, count: 0, benefits: 0, top: null, categories: [] });
    return buckets.get(key)!;
  };

  // pre-seed everyone so members without matches still appear
  ensure("self", selfName, "You");
  for (const m of family) ensure(`fam:${m.name}`, m.name, m.relationship ?? "family");

  for (const r of recommendations) {
    const isSelf = r.matchedFor === "you";
    const key = isSelf ? "self" : `fam:${(r.matchedFor as { name: string }).name}`;
    const label = isSelf
      ? selfName
      : (r.matchedFor as { name: string }).name;
    const sublabel = isSelf
      ? "You"
      : (r.matchedFor as { relationship: string }).relationship ?? "family";
    const b = ensure(key, label, sublabel);
    b.count += 1;
    b.benefits += estimateBenefit(r);
    if (!b.top || r.score > b.top.score) b.top = r;
    if (r.scheme.category && !b.categories.includes(r.scheme.category))
      b.categories.push(r.scheme.category);
  }

  const people = [...buckets.values()].sort((a, b) => b.benefits - a.benefits);
  const totalBenefits = people.reduce((a, p) => a + p.benefits, 0);
  const totalEligible = people.reduce((a, p) => a + p.count, 0);
  const covered = people.filter((p) => p.count > 0).length;
  const coveragePct = people.length ? Math.round((covered / people.length) * 100) : 0;

  return { people, totalBenefits, totalEligible, coveragePct };
}

export function HouseholdSummaryCard({ summary }: { summary: HouseholdSummary }) {
  if (summary.people.length === 0) return null;
  return (
    <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <span
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-primary-foreground"
          style={{ backgroundColor: "var(--trust)" }}
        >
          <Home className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-[var(--saffron)]">
            Household welfare
          </p>
          <h2 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            What SAARTHI found for your household
          </h2>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <Metric
          label="People covered"
          value={`${summary.people.filter((p) => p.count > 0).length} / ${summary.people.length}`}
          icon={Users}
        />
        <Metric label="Total matches" value={String(summary.totalEligible)} icon={Sparkles} />
        <Metric
          label="Estimated benefits"
          value={`₹${summary.totalBenefits.toLocaleString("en-IN")}`}
          icon={TrendingUp}
        />
      </div>

      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {summary.people.map((p) => (
          <li
            key={p.key}
            className="rounded-2xl border border-border/70 bg-background/60 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{p.label}</p>
                <p className="text-xs capitalize text-muted-foreground">{p.sublabel}</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  matches
                </p>
                <p className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                  {p.count}
                </p>
              </div>
            </div>
            {p.count === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">
                No matches yet. Add age, occupation or income to unlock schemes.
              </p>
            ) : (
              <>
                <p className="mt-2 text-xs text-muted-foreground">
                  Est. ₹{p.benefits.toLocaleString("en-IN")} in benefits
                </p>
                {p.top && (
                  <Link
                    to="/schemes/$id"
                    params={{ id: p.top.scheme.id }}
                    className="mt-2 inline-flex text-xs font-medium text-[var(--trust)] underline-offset-4 hover:underline"
                  >
                    Top match: {p.top.scheme.short_name ?? p.top.scheme.name} →
                  </Link>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
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