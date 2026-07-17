import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Recommendation } from "@/lib/rules-engine";

export type ReportCitizen = {
  full_name: string;
  age?: number | null;
  gender?: string | null;
  mobile?: string | null;
  state?: string | null;
  district?: string | null;
  occupation?: string | null;
  monthly_income?: number | null;
  marital_status?: string | null;
  category?: string | null;
  has_disability?: boolean | null;
  household_size?: number | null;
  household_type?: string | null;
  notes?: string | null;
  status?: string | null;
  estimated_benefits?: number | null;
};

export type ReportFamilyMember = {
  name: string;
  relationship: string;
  age?: number | null;
  gender?: string | null;
};

function fmt(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v);
}

function fmtINR(n?: number | null): string {
  if (n == null) return "—";
  return `₹${Number(n).toLocaleString("en-IN")}`;
}

export function WelfareReport({
  citizen,
  family,
  recommendations,
  partnerLabel = "SAARTHI Welfare Partner",
}: {
  citizen: ReportCitizen;
  family: ReportFamilyMember[];
  recommendations: Recommendation[];
  partnerLabel?: string;
}) {
  const today = new Date().toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <div className="flex items-center justify-between gap-3 print:hidden">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-[var(--saffron)]">
            Welfare report
          </p>
          <h2 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            Printable summary for {citizen.full_name}
          </h2>
        </div>
        <Button onClick={() => window.print()} className="rounded-full">
          <Printer className="mr-2 h-4 w-4" />
          Print / Save PDF
        </Button>
      </div>

      <div
        id="welfare-report"
        className="mt-4 rounded-3xl border border-border/70 bg-white p-8 text-[13px] leading-relaxed text-slate-900 shadow-sm print:mt-0 print:rounded-none print:border-0 print:p-0 print:shadow-none"
      >
        <header className="flex items-start justify-between border-b border-slate-300 pb-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              Welfare Eligibility Report
            </p>
            <h1 className="mt-1 text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              {citizen.full_name}
            </h1>
            <p className="mt-0.5 text-xs text-slate-600">
              Prepared by {partnerLabel} · {today}
            </p>
          </div>
          <div className="text-right text-[11px] text-slate-500">
            <p>SAARTHI</p>
            <p>Government Welfare Navigator</p>
          </div>
        </header>

        <section className="mt-5">
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
            Citizen Profile
          </h3>
          <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-3">
            <Row label="Age" value={fmt(citizen.age)} />
            <Row label="Gender" value={fmt(citizen.gender)} />
            <Row label="Mobile" value={fmt(citizen.mobile)} />
            <Row label="Occupation" value={fmt(citizen.occupation)} />
            <Row label="Monthly income" value={fmtINR(citizen.monthly_income)} />
            <Row label="Marital status" value={fmt(citizen.marital_status)} />
            <Row label="Category" value={fmt(citizen.category)} />
            <Row label="Disability" value={fmt(citizen.has_disability)} />
            <Row
              label="Location"
              value={[citizen.district, citizen.state].filter(Boolean).join(", ") || "—"}
            />
            <Row
              label="Household"
              value={[
                citizen.household_type,
                citizen.household_size ? `${citizen.household_size} members` : null,
              ]
                .filter(Boolean)
                .join(" · ") || "—"}
            />
            <Row label="Follow-up stage" value={fmt(citizen.status)} />
            <Row label="Benefits unlocked" value={fmtINR(citizen.estimated_benefits)} />
          </dl>
        </section>

        {family.length > 0 && (
          <section className="mt-5">
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              Household members ({family.length})
            </h3>
            <ul className="mt-2 divide-y divide-slate-200 border-y border-slate-200">
              {family.map((m, i) => (
                <li key={i} className="flex items-center justify-between py-1.5">
                  <span className="font-medium">{m.name}</span>
                  <span className="text-slate-600">
                    {[m.relationship, m.age && `${m.age}y`, m.gender].filter(Boolean).join(" · ")}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-5">
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
            Recommended schemes ({recommendations.length})
          </h3>
          {recommendations.length === 0 ? (
            <p className="mt-2 text-slate-500">No recommendations available yet.</p>
          ) : (
            <ol className="mt-2 space-y-3">
              {recommendations.map((r, i) => {
                const forWhom =
                  r.matchedFor === "you"
                    ? "Self"
                    : `${r.matchedFor.name} (${r.matchedFor.relationship})`;
                return (
                  <li
                    key={`${r.scheme.id}-${i}`}
                    className="break-inside-avoid rounded-lg border border-slate-200 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold">
                          {i + 1}. {r.scheme.name}
                        </p>
                        <p className="text-[11px] uppercase tracking-widest text-slate-500">
                          {r.scheme.category} · For {forWhom} · Confidence: {r.confidence}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full border border-slate-300 px-2 py-0.5 text-[11px]">
                        {Math.round(r.score * 100)}% match
                      </span>
                    </div>
                    <p className="mt-1.5 text-slate-700">{r.why_recommended}</p>
                    {r.why_eligible.length > 0 && (
                      <ul className="mt-1.5 grid gap-0.5 sm:grid-cols-2">
                        {r.why_eligible.slice(0, 6).map((e, j) => (
                          <li key={j} className="text-slate-600">
                            {e.passed ? "✓" : "•"} {e.label}
                            {e.note ? ` — ${e.note}` : ""}
                          </li>
                        ))}
                      </ul>
                    )}
                    {r.gaps.length > 0 && (
                      <p className="mt-1.5 text-slate-500">
                        <span className="font-medium">To confirm:</span> {r.gaps.join(", ")}
                      </p>
                    )}
                    {r.scheme.official_url && (
                      <p className="mt-1 break-all text-[11px] text-slate-500">
                        Official: {r.scheme.official_url}
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        {citizen.notes && (
          <section className="mt-5">
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              Intake notes
            </h3>
            <p className="mt-2 whitespace-pre-wrap text-slate-700">{citizen.notes}</p>
          </section>
        )}

        <footer className="mt-6 border-t border-slate-300 pt-3 text-[10.5px] text-slate-500">
          Recommendations are generated deterministically from official scheme rules and the
          citizen's stated profile. Final eligibility is subject to verification by the respective
          government department. This document is for guidance only.
        </footer>
      </div>

      <style>{`
        @media print {
          @page { size: A4; margin: 14mm; }
          body * { visibility: hidden !important; }
          #welfare-report, #welfare-report * { visibility: visible !important; }
          #welfare-report { position: absolute; inset: 0; width: 100%; }
        }
      `}</style>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10.5px] font-medium uppercase tracking-widest text-slate-500">
        {label}
      </dt>
      <dd className="text-slate-900">{value}</dd>
    </div>
  );
}