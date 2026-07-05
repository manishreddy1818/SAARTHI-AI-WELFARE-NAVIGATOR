import { useEffect, useRef, useState } from "react";
import { BrandMark } from "@/components/brand";
import { Play } from "lucide-react";

type Phase =
  | { kind: "logo-in" }
  | { kind: "line"; text: string }
  | { kind: "logo-out" };

const SEQUENCE: Phase[] = [
  { kind: "logo-in" },
  { kind: "line", text: "Every year, millions of eligible citizens miss government benefits." },
  { kind: "line", text: "Not because they are not eligible…" },
  { kind: "line", text: "…but because they never knew they existed." },
  { kind: "logo-out" },
];

// Written phonetically so the TTS engine reads "Saarthi" as a word,
// not "S-A-A-R-T-H-I".
const NARRATION =
  "Namaste. I am Saarthi, your A.I. Welfare Navigator. Every year, millions of eligible citizens miss government benefits. Not because they are not eligible, but because they never knew they existed. Let's make sure you never miss a benefit you deserve.";

const FALLBACK_TOTAL_MS = 11000;

export function CinematicSplash({ onFinish }: { onFinish: () => void }) {
  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const cleanup = () => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
  };

  useEffect(() => () => cleanup(), []);

  // Schedule visual line progression to line up with `totalMs`.
  const scheduleVisuals = (totalMs: number) => {
    // Weights per phase (logo-in, line, line, line, logo-out).
    const weights = [0.15, 0.22, 0.18, 0.22, 0.23];
    let acc = 0;
    weights.forEach((w, i) => {
      acc += w;
      if (i < weights.length - 1) {
        const t = window.setTimeout(() => setIdx(i + 1), totalMs * acc);
        timersRef.current.push(t);
      }
    });
    const done = window.setTimeout(() => onFinish(), totalMs + 400);
    timersRef.current.push(done);
  };

  const begin = async () => {
    if (started) return;
    setStarted(true);

    // Create the audio element synchronously inside the user gesture so
    // mobile browsers (iOS Safari, Android Chrome) allow playback.
    const audio = new Audio();
    audio.preload = "auto";
    audio.autoplay = false;
    audioRef.current = audio;

    if (reducedMotion) {
      scheduleVisuals(4000);
      return;
    }

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: NARRATION,
          voice: "sage",
          instructions:
            "Speak with a warm, calm Indian English accent. Cinematic, hopeful and gentle pacing.",
        }),
      });
      if (!res.ok) throw new Error("tts failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      audio.src = url;

      await new Promise<void>((resolve, reject) => {
        audio.onloadedmetadata = () => resolve();
        audio.onerror = () => reject(new Error("audio load error"));
        // Safety timeout.
        const t = window.setTimeout(() => resolve(), 4000);
        timersRef.current.push(t);
      });

      const totalMs =
        Number.isFinite(audio.duration) && audio.duration > 1
          ? audio.duration * 1000
          : FALLBACK_TOTAL_MS;

      scheduleVisuals(totalMs);
      try {
        await audio.play();
      } catch {
        // Autoplay blocked — visuals still proceed.
      }
      audio.onended = () => onFinish();
    } catch {
      // TTS unavailable — still show the visual sequence.
      scheduleVisuals(FALLBACK_TOTAL_MS);
    }
  };

  const skip = () => {
    cleanup();
    onFinish();
  };

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
        onClick={skip}
        className="absolute right-4 top-4 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs uppercase tracking-widest text-white/70 backdrop-blur hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        aria-label="Skip introduction"
      >
        Skip
      </button>

      <div className="relative flex min-h-[280px] w-full max-w-3xl flex-col items-center justify-center px-6 text-center">
        {!started && (
          <div className="flex flex-col items-center gap-6">
            <div className="rounded-3xl bg-white/10 p-4 shadow-2xl ring-1 ring-white/15 backdrop-blur">
              <BrandMark size={72} />
            </div>
            <div
              className="text-4xl font-semibold tracking-tight sm:text-5xl"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
            >
              SAARTHI
            </div>
            <p className="max-w-md text-balance text-sm text-white/70 sm:text-base">
              Your AI Welfare Navigator
            </p>
            <button
              onClick={begin}
              className="mt-2 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-[oklch(0.14_0.04_265)] shadow-xl transition hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Play className="h-4 w-4 fill-current" /> Begin introduction
            </button>
            <p className="text-xs text-white/50">Tap to enable sound</p>
          </div>
        )}

        {started && (
          <>
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
          </>
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