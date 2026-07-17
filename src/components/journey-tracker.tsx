import { Check, Circle } from "lucide-react";

type Rec = { scheme: { required_documents?: string[] | null } };
type Doc = { label?: string | null; doc_type?: string | null; status?: string | null };
type App = { status?: string | null };

const AVAILABLE_STATUSES = new Set(["have", "verified"]);

function normalise(s: string) {
  return s.trim().toLowerCase();
}

export function computeJourneyStages({
  completeness,
  recommendations,
  documents,
  applications,
}: {
  completeness: number;
  recommendations: Rec[];
  documents: Doc[];
  applications: App[];
}) {
  const eligible = recommendations.length > 0;

  // Collect required documents across top recommendations
  const required = new Set<string>();
  for (const r of recommendations.slice(0, 5)) {
    for (const d of r.scheme.required_documents ?? []) required.add(normalise(d));
  }
  const available = new Set(
    documents
      .filter((d) => AVAILABLE_STATUSES.has((d.status ?? "").toLowerCase()))
      .map((d) => normalise(d.label ?? d.doc_type ?? "")),
  );
  const missing = [...required].filter((d) => !available.has(d));
  const docsAvailable = eligible && required.size > 0 && missing.length === 0;

  const submitted = applications.some((a) =>
    ["submitted", "approved"].includes((a.status ?? "").toLowerCase()),
  );
  const processing = applications.some((a) =>
    ["in_progress", "submitted", "approved"].includes((a.status ?? "").toLowerCase()),
  );
  const received = applications.some((a) => (a.status ?? "").toLowerCase() === "approved");

  return {
    missingCount: missing.length,
    requiredCount: required.size,
    stages: [
      { key: "profile", label: "Profile Completed", done: completeness >= 80 },
      { key: "eligibility", label: "Eligibility Checked", done: eligible },
      {
        key: "documents",
        label: "Documents Available",
        done: docsAvailable,
        hint:
          !docsAvailable && required.size > 0 && eligible
            ? "Add your remaining required documents to continue."
            : undefined,
      },
      { key: "submitted", label: "Application Submitted", done: submitted },
      { key: "processing", label: "Application Processing", done: processing },
      { key: "received", label: "Benefits Received", done: received },
    ],
  };
}

export function JourneyTracker(props: {
  completeness: number;
  recommendations: Rec[];
  documents: Doc[];
  applications: App[];
}) {
  const { stages } = computeJourneyStages(props);
  const docStage = stages.find((s) => s.key === "documents");
  return (
    <div className="rounded-3xl border border-border/70 bg-card p-6">
      <p className="text-sm uppercase tracking-widest text-muted-foreground">Welfare journey</p>
      <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stages.map((s) => (
          <li
            key={s.key}
            className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/60 p-3"
          >
            <span
              className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                s.done
                  ? "bg-[color-mix(in_oklch,var(--success)_15%,transparent)] text-[var(--success)]"
                  : "bg-muted text-muted-foreground"
              }`}
              aria-hidden
            >
              {s.done ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
            </span>
            <div className="min-w-0">
              <p className={`text-sm font-medium ${s.done ? "" : "text-muted-foreground"}`}>
                {s.label}
              </p>
              {"hint" in s && s.hint && (
                <p className="mt-1 text-xs text-muted-foreground">{s.hint}</p>
              )}
            </div>
          </li>
        ))}
      </ol>
      <p className="sr-only" aria-live="polite">
        {docStage?.done
          ? "Documents available stage complete."
          : docStage?.hint ?? ""}
      </p>
    </div>
  );
}