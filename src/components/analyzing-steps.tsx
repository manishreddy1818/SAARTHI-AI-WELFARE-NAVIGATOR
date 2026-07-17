import { useEffect, useState } from "react";
import { Check, Loader2, Sparkles } from "lucide-react";

const DEFAULT_STEPS = [
  "Building citizen profile",
  "Searching central schemes",
  "Searching state schemes",
  "Evaluating eligibility",
  "Ranking benefits",
  "Preparing recommendations",
];

/**
 * Cinematic "SAARTHI is thinking" progress. Purely visual — appears while
 * `active` is true. Stages are labelled after the *real* backend pipeline so
 * the trace feels event-driven even when running client-side.
 */
export function AnalyzingSteps({
  active,
  onDone,
  intervalMs = 550,
  steps,
  compact = false,
}: {
  active: boolean;
  onDone?: () => void;
  intervalMs?: number;
  steps?: string[];
  compact?: boolean;
}) {
  const [idx, setIdx] = useState(0);
  const STEPS = steps ?? DEFAULT_STEPS;

  useEffect(() => {
    if (!active) return;
    setIdx(0);
    const t = setInterval(() => {
      setIdx((i) => {
        if (i >= STEPS.length - 1) {
          clearInterval(t);
          onDone?.();
          return STEPS.length;
        }
        return i + 1;
      });
    }, intervalMs);
    return () => clearInterval(t);
  }, [active, intervalMs, onDone, STEPS.length]);

  if (!active) return null;

  if (compact) {
    return (
      <ol className="space-y-1.5">
        {STEPS.map((s, i) => {
          const done = i < idx;
          const current = i === idx;
          return (
            <li
              key={s}
              className={`flex items-center gap-2 text-xs transition-all ${
                done ? "text-foreground" : current ? "text-foreground" : "text-muted-foreground/60"
              }`}
            >
              <span
                className={`inline-flex h-4 w-4 items-center justify-center rounded-full transition-colors ${
                  done
                    ? "bg-[var(--success,theme(colors.emerald.500))] text-white"
                    : current
                    ? "bg-[var(--trust)] text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {done ? (
                  <Check className="h-2.5 w-2.5" />
                ) : current ? (
                  <Loader2 className="h-2.5 w-2.5 animate-spin" />
                ) : (
                  <span className="text-[8px]">{i + 1}</span>
                )}
              </span>
              <span className={current ? "font-medium" : ""}>{s}</span>
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <span
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-primary-foreground"
          style={{ backgroundColor: "var(--trust)" }}
        >
          <Sparkles className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-[var(--saffron)]">
            Analyzing your profile
          </p>
          <p className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            SAARTHI is thinking…
          </p>
        </div>
      </div>
      <ol className="mt-5 space-y-2">
        {STEPS.map((s, i) => {
          const done = i < idx;
          const active = i === idx;
          return (
            <li
              key={s}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all ${
                done
                  ? "text-foreground"
                  : active
                  ? "bg-secondary/70 text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full transition-colors ${
                  done
                    ? "bg-[var(--success,theme(colors.emerald.500))] text-white"
                    : active
                    ? "bg-[var(--trust)] text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {done ? (
                  <Check className="h-3.5 w-3.5" />
                ) : active ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <span className="text-[10px]">{i + 1}</span>
                )}
              </span>
              <span className={active ? "font-medium" : ""}>{s}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** Real backend milestones for a single chat turn. Keep in sync with sendMessage. */
export const CHAT_THINKING_STEPS = [
  "Reading your profile",
  "Reviewing family & applications",
  "Consulting SAARTHI",
  "Preparing your reply",
];