import { useCallback, useEffect, useRef, useState } from "react";

const MUTE_KEY = "saarthi.tts.muted";
const VOICE_KEY = "saarthi.tts.voice";
const ACCENT_KEY = "saarthi.tts.accent";

export const VOICE_OPTIONS = [
  { id: "alloy", label: "Alloy — warm neutral" },
  { id: "sage", label: "Sage — calm" },
  { id: "verse", label: "Verse — expressive" },
  { id: "coral", label: "Coral — bright" },
  { id: "ash", label: "Ash — deep" },
  { id: "shimmer", label: "Shimmer — soft" },
] as const;

export const ACCENT_OPTIONS = [
  { id: "neutral", label: "Neutral", instructions: "" },
  {
    id: "indian",
    label: "Indian English",
    instructions:
      "Speak with a natural, warm Indian English accent. Clear pronunciation, gentle pace, friendly tone.",
  },
  {
    id: "british",
    label: "British English",
    instructions: "Speak with a clear, polite British English (Received Pronunciation) accent.",
  },
  {
    id: "american",
    label: "American English",
    instructions: "Speak with a friendly, conversational American English accent.",
  },
  {
    id: "hindi",
    label: "Hindi-leaning",
    instructions:
      "Speak with a natural Hindi-influenced Indian accent, warm and respectful. Slightly slower pace.",
  },
] as const;

type AccentId = (typeof ACCENT_OPTIONS)[number]["id"];

export function useSpeech() {
  const [muted, setMutedState] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(MUTE_KEY) === "1";
  });
  const [voice, setVoiceState] = useState<string>(() => {
    if (typeof window === "undefined") return "alloy";
    return window.localStorage.getItem(VOICE_KEY) || "alloy";
  });
  const [accent, setAccentState] = useState<AccentId>(() => {
    if (typeof window === "undefined") return "indian";
    return ((window.localStorage.getItem(ACCENT_KEY) as AccentId) || "indian");
  });
  const [speaking, setSpeaking] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastRef = useRef<{ id: string; text: string } | null>(null);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    setSpeaking(false);
    setLoadingId(null);
  }, []);

  useEffect(() => () => stop(), [stop]);

  const speak = useCallback(
    async (id: string, text: string, opts?: { force?: boolean }) => {
      if (!text?.trim()) return;
      lastRef.current = { id, text };
      if (muted && !opts?.force) return;
      stop();
      setLoadingId(id);
      const ac = new AbortController();
      abortRef.current = ac;
      try {
        const accentDef = ACCENT_OPTIONS.find((a) => a.id === accent);
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            voice,
            instructions: accentDef?.instructions || undefined,
          }),
          signal: ac.signal,
        });
        if (!res.ok) throw new Error(`tts ${res.status}`);
        const blob = await res.blob();
        if (ac.signal.aborted) return;
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => {
          setSpeaking(false);
          URL.revokeObjectURL(url);
        };
        audio.onpause = () => setSpeaking(false);
        audio.onplay = () => setSpeaking(true);
        await audio.play();
      } catch {
        // silent — TTS is best-effort
      } finally {
        setLoadingId((cur) => (cur === id ? null : cur));
      }
    },
    [muted, stop, voice, accent],
  );

  const replay = useCallback(() => {
    if (lastRef.current) speak(lastRef.current.id, lastRef.current.text, { force: true });
  }, [speak]);

  const setMuted = useCallback(
    (m: boolean) => {
      setMutedState(m);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(MUTE_KEY, m ? "1" : "0");
      }
      if (m) stop();
    },
    [stop],
  );

  const setVoice = useCallback((v: string) => {
    setVoiceState(v);
    if (typeof window !== "undefined") window.localStorage.setItem(VOICE_KEY, v);
  }, []);

  const setAccent = useCallback((a: AccentId) => {
    setAccentState(a);
    if (typeof window !== "undefined") window.localStorage.setItem(ACCENT_KEY, a);
  }, []);

  return {
    speak,
    stop,
    replay,
    muted,
    setMuted,
    speaking,
    loadingId,
    voice,
    setVoice,
    accent,
    setAccent,
  };
}