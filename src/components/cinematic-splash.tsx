import { useEffect, useState } from "react";
import { BrandMark } from "@/components/brand";

type Phase =
  | { kind: "logo-in"; ms: 1600 }
  | { kind: "line"; text: string; ms: number }
  | { kind: "logo-out"; ms: 1800 }
  | { kind: "done" };

const SEQUENCE: Phase[] = [
  { kind: "logo-in", ms: 1600 },
  { kind: "line", text: "Every year, millions of eligible citizens miss government benefits.", ms: 3200 },
  { kind: "line", text: "Not because they are not eligible…", ms: 2600 },
  { kind: "line", text: "…but because they never knew they existed.", ms: 3000 },
  { kind: "logo-out", ms: 1800 },
  { kind: "done" },
];

const NARRATION =
  "Namaste. I'm SAARTHI, your AI Welfare Navigator. Let's make sure you never miss a government benefit you deserve.";

export function CinematicSplash({ onFinish }: { onFinish: () => void }) {
  const [idx, setIdx] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
  }, []);

  useEffect(() => {
    const step = SEQUENCE[idx];
    if (!step || step.kind === "done") {
      onFinish();
      return;
    }
    const ms = reducedMotion ? Math.min(step.ms as number, 900) : (step.ms as number);
    const t = window.setTimeout(() => setIdx((i) => i + 1), ms);
    return () => window.clearTimeout(t);
  }, [idx, onFinish, reducedMotion]);

  // Attempt narration once, non-blocking.
  useEffect(() => {
    if (reducedMotion) return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(NARRATION);
    u.rate = 0.95;
    u.pitch = 1;
    u.volume = 0.9;
    const t = window.setTimeout(() => {
      try {
        window.speechSynthesis.speak(u);
      } catch {
        // ignore
      }
    }, 1400);
    return () => {
      window.clearTimeout(t);
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    };
  }, [reducedMotion]);

  const step = SEQUENCE[idx];

  return (
    <div
      role="dialog"
      aria-label="SAARTHI introduction"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-[oklch(0.14_0.04_265)] text-white"
    >
      {/* Ambient background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 55% at 20% 20%, oklch(0.72 0.17 55 / 0.22), transparent 70%), radial-gradient(50% 45% at 85% 80%, oklch(0.55 0.14 265 / 0.35), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "conic-gradient(from 210deg at 50% 50%, transparent 0deg, oklch(0.55 0.14 265 / 0.18) 90deg, transparent 200deg)",
          animation: reducedMotion ? undefined : "saarthi-drift 14s linear infinite",
        }}
      />

      {/* Skip */}
      <button
        onClick={onFinish}
        className="absolute right-4 top-4 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs uppercase tracking-widest text-white/70 backdrop-blur hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        aria-label="Skip introduction"
      >
        Skip
      </button>

      <div className="relative flex min-h-[280px] w-full max-w-3xl flex-col items-center justify-center px-6 text-center">
        {(step?.kind === "logo-in" || step?.kind === "logo-out") && (
          <div className="animate-[saarthi-bloom_1.4s_ease-out_both] flex flex-col items-center gap-5">
            <div className="rounded-3xl bg-white/10 p-4 shadow-2xl ring-1 ring-white/15 backdrop-blur">
              <BrandMark size={72} />
            </div>
            <div
              className="text-4xl font-semibold tracking-tight sm:text-5xl"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
            >
              SAARTHI
            </div>
            {step.kind === "logo-out" && (
              <p className="max-w-xl text-balance text-sm text-white/70 sm:text-base">
                Your AI Welfare Navigator
              </p>
            )}
          </div>
        )}

        {step?.kind === "line" && (
          <p
            key={idx}
            className="animate-[saarthi-line_600ms_ease-out_both] max-w-2xl text-balance text-2xl font-medium leading-snug sm:text-3xl md:text-4xl"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}
          >
            {step.text}
          </p>
        )}
      </div>

      <style>{`
        @keyframes saarthi-bloom {
          0% { opacity: 0; transform: translateY(12px) scale(0.96); filter: blur(6px); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @keyframes saarthi-line {
          0% { opacity: 0; transform: translateY(8px); filter: blur(4px); }
          100% { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        @keyframes saarthi-drift {
          to { transform: rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-[saarthi-bloom_1_4s_ease-out_both],
          .animate-[saarthi-line_600ms_ease-out_both] { animation-duration: 200ms !important; }
        }
      `}</style>
    </div>
  );
}