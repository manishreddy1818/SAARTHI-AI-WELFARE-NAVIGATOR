import { useEffect, useState } from "react";
import { Check, Loader2, Sparkles } from "lucide-react";

const STEPS = [
  "Building citizen profile",
  "Searching central schemes",
  "Searching state schemes",
  "Evaluating eligibility",
  "Ranking benefits",
  "Preparing recommendations",
];

/** Cinematic "SAARTHI is thinking" progress. Purely visual — appears while `active` is true. */
export function AnalyzingSteps({
  active,
  onDone,
  intervalMs = 550,
}: {
  active: boolean;
  onDone?: () => void;
  intervalMs?: number;
}) {
  const [idx, setIdx] = useState(0);

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
  }, [active, intervalMs, onDone]);

  if (!active) return null;

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