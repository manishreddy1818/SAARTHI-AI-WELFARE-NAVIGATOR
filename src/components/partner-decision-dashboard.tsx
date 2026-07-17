import { Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, ClipboardList, Flame, ShieldCheck } from "lucide-react";
import { StatusBadge } from "@/components/partner-status-badge";

/** Loose citizen row shape (avoids coupling to generated types). */
export type PartnerCitizenRow = {
  id: string;
  full_name: string;
  mobile?: string | null;
  age?: number | null;
  gender?: string | null;
  state?: string | null;
  district?: string | null;
  occupation?: string | null;
  monthly_income?: number | null;
  category?: string | null;
  marital_status?: string | null;
  has_disability?: boolean | null;
  household_type?: string | null;
  household_size?: number | null;
  status?: string | null;
  estimated_benefits?: number | null;
  applications_started?: number | null;
  applications_completed?: number | null;
  last_activity_at?: string | null;
  created_at?: string | null;
};

export type DecisionFlag = {
  kind: "info-gap" | "priority" | "stalled" | "high-value";
  label: string;
};

export type DecisionRow = {
  citizen: PartnerCitizenRow;
  score: number;
  flags: DecisionFlag[];
  recommendation: string;
};

const DAY = 24 * 60 * 60 * 1000;

function daysSince(iso?: string | null): number {
  if (!iso) return 999;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return 999;
  return Math.max(0, Math.round((Date.now() - t) / DAY));
}

/** Deterministic risk + priority scorer. No LLM. */
export function buildDecisionQueue(
  citizens: PartnerCitizenRow[],
  limit = 6,
): DecisionRow[] {
  const rows: DecisionRow[] = [];
  for (const c of citizens) {
    const flags: DecisionFlag[] = [];
    let score = 0;

    // information gaps (block matching)
    const missing: string[] = [];
    if (c.age == null) missing.push("age");
    if (!c.gender) missing.push("gender");
    if (c.monthly_income == null) missing.push("income");
    if (!c.state) missing.push("state");
    if (!c.district) missing.push("district");
    if (!c.occupation) missing.push("occupation");
    if (missing.length) {
      flags.push({ kind: "info-gap", label: `Missing: ${missing.slice(0, 3).join(", ")}` });
      score += Math.min(missing.length, 3) * 6;
    }

    // priority signals
    const started = Number(c.applications_started ?? 0);
    const completed = Number(c.applications_completed ?? 0);
    if ((c.age ?? 0) >= 60 && started === 0) {
      flags.push({ kind: "priority", label: "Elderly, no applications yet" });
      score += 18;
    }
    if (c.marital_status === "widow" && started === 0) {
      flags.push({ kind: "priority", label: "Widow — pension likely" });
      score += 16;
    }
    if (c.has_disability && started === 0) {
      flags.push({ kind: "priority", label: "PwD — disability schemes" });
      score += 16;
    }
    if ((c.monthly_income ?? Infinity) <= 8000 && started === 0) {
      flags.push({ kind: "priority", label: "Low income, unactioned" });
      score += 12;
    }

    // stalled
    const days = daysSince(c.last_activity_at ?? c.created_at);
    if (c.status && c.status !== "completed" && days >= 7) {
      flags.push({ kind: "stalled", label: `Stalled ${days}d` });
      score += Math.min(20, days / 2);
    }

    // high-value
    const benefits = Number(c.estimated_benefits ?? 0);
    if (benefits >= 20000 && completed === 0) {
      flags.push({
        kind: "high-value",
        label: `₹${benefits.toLocaleString("en-IN")} at stake`,
      });
      score += 10 + Math.min(20, Math.log10(1 + benefits) * 4);
    }

    if (flags.length === 0) continue;

    const recommendation =
      missing.length >= 2
        ? "Complete intake profile"
        : flags.some((f) => f.kind === "priority")
          ? "Start application today"
          : flags.some((f) => f.kind === "stalled")
            ? "Follow up now"
            : "Review recommendations";

    rows.push({ citizen: c, score, flags, recommendation });
  }
  rows.sort((a, b) => b.score - a.score);
  return rows.slice(0, limit);
}

export function PartnerDecisionDashboard({
  citizens,
}: {
  citizens: PartnerCitizenRow[];
}) {
  const queue = buildDecisionQueue(citizens);
  const critical = queue.filter((q) => q.score >= 25).length;
  const infoGaps = queue.filter((q) => q.flags.some((f) => f.kind === "info-gap")).length;
  const stalled = queue.filter((q) => q.flags.some((f) => f.kind === "stalled")).length;

  if (queue.length === 0) return null;

  return (
    <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <span
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-primary-foreground"
          style={{ backgroundColor: "var(--trust)" }}
        >
          <ClipboardList className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-[var(--saffron)]">
            Decision dashboard
          </p>
          <h2 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            Where your attention matters most today
          </h2>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <MiniStat icon={Flame} label="High priority" value={String(critical)} />
        <MiniStat icon={AlertTriangle} label="Info gaps" value={String(infoGaps)} />
        <MiniStat icon={ShieldCheck} label="Stalled" value={String(stalled)} />
      </div>

      <ul className="mt-5 divide-y divide-border/60">
        {queue.map((row) => (
          <li key={row.citizen.id} className="py-3">
            <Link
              to="/partner/citizens/$id"
              params={{ id: row.citizen.id }}
              className="group flex items-start justify-between gap-4 rounded-xl px-2 py-2 hover:bg-secondary/40"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{row.citizen.full_name}</p>
                  {row.citizen.status && <StatusBadge status={row.citizen.status as any} />}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {[
                    row.citizen.age && `${row.citizen.age}y`,
                    row.citizen.gender,
                    row.citizen.occupation,
                    row.citizen.district,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {row.flags.map((f, i) => (
                    <li key={i} className={flagClasses(f.kind)}>
                      {f.label}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Recommended
                </p>
                <p className="mt-0.5 text-sm font-semibold text-[var(--trust)]">
                  {row.recommendation}
                </p>
                <span className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground group-hover:text-foreground">
                  Open <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function flagClasses(kind: DecisionFlag["kind"]): string {
  const base = "rounded-full px-2 py-0.5 text-[11px] font-medium";
  switch (kind) {
    case "priority":
      return `${base} bg-[color:oklch(0.94_0.07_35)] text-[color:oklch(0.4_0.15_35)]`;
    case "info-gap":
      return `${base} bg-secondary text-secondary-foreground`;
    case "stalled":
      return `${base} bg-muted text-muted-foreground`;
    case "high-value":
      return `${base} bg-[color:oklch(0.94_0.08_150)] text-[color:oklch(0.35_0.12_150)]`;
  }
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
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