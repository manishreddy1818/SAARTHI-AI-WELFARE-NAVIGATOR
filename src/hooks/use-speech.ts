import { useCallback, useEffect, useRef, useState } from "react";

const MUTE_KEY = "saarthi.tts.muted";

export function useSpeech() {
  const [muted, setMutedState] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(MUTE_KEY) === "1";
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
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
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
    [muted, stop],
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

  return { speak, stop, replay, muted, setMuted, speaking, loadingId };
}