import { Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, HelpCircle, ShieldCheck, Sparkles } from "lucide-react";
import type { Recommendation } from "@/lib/rules-engine";

const CONFIDENCE_LABEL: Record<Recommendation["confidence"], string> = {
  high: "High match",
  medium: "Good match",
  low: "Possible match",
};
const CONFIDENCE_COLOR: Record<Recommendation["confidence"], string> = {
  high: "var(--success)",
  medium: "var(--saffron)",
  low: "var(--muted-foreground)",
};

export function SchemeCard({ rec }: { rec: Recommendation }) {
  const forWho =
    rec.matchedFor === "you"
      ? "For you"
      : `For ${rec.matchedFor.name} (${rec.matchedFor.relationship})`;
  const primaryBenefit = rec.scheme.benefits?.[0] ?? rec.scheme.summary;
  return (
    <Link
      to="/schemes/$id"
      params={{ id: rec.scheme.id }}
      className="group flex h-full flex-col gap-4 rounded-3xl border border-border/70 bg-card p-6 transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {forWho}
          </p>
          <h3 className="mt-1 text-lg font-semibold leading-tight">
            {rec.scheme.name}
          </h3>
          {rec.scheme.short_name && (
            <p className="text-xs text-muted-foreground">{rec.scheme.short_name}</p>
          )}
        </div>
        <span
          className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
          style={{
            color: CONFIDENCE_COLOR[rec.confidence],
            backgroundColor: `color-mix(in oklch, ${CONFIDENCE_COLOR[rec.confidence]} 15%, transparent)`,
          }}
        >
          <BadgeCheck className="h-3.5 w-3.5" />
          {CONFIDENCE_LABEL[rec.confidence]}
        </span>
      </div>
      <p className="text-sm text-muted-foreground line-clamp-3">{primaryBenefit}</p>
      <div className="mt-auto flex flex-col gap-2">
        <div className="flex items-start gap-2 rounded-2xl bg-secondary/70 px-3 py-2 text-xs text-secondary-foreground">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 text-[var(--saffron)]" />
          <span className="leading-relaxed">{rec.why_recommended}</span>
        </div>
          {rec.gaps.length > 0 && (
            <div
              className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
              title={`Add ${rec.gaps.join(", ")} to strengthen this match.`}
            >
              <HelpCircle className="h-3 w-3" />
              <span>
                {rec.gaps.length} missing fact{rec.gaps.length === 1 ? "" : "s"} could raise confidence
              </span>
            </div>
          )}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            Explained · {rec.scheme.ministry?.split("&")[0].trim() ?? "Central"}
          </span>
          <span className="inline-flex items-center gap-1 font-medium text-[var(--trust)] group-hover:translate-x-0.5 transition-transform">
            View details
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}