import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, Square } from "lucide-react";
import { toast } from "sonner";

type Props = {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  size?: number;
};

export function VoiceOrb({ onTranscript, disabled, size = 72 }: Props) {
  const [state, setState] = useState<"idle" | "recording" | "processing">("idle");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function start() {
    if (disabled || state !== "idle") return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";
      const rec = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        const blob = new Blob(chunksRef.current, { type: mimeType });
        if (blob.size < 2048) {
          toast.error("Recording was too short. Try again.");
          setState("idle");
          return;
        }
        setState("processing");
        try {
          const form = new FormData();
          form.append("file", blob, "recording.webm");
          const res = await fetch("/api/stt", { method: "POST", body: form });
          const data = (await res.json()) as { text?: string; error?: string };
          if (!res.ok || data.error) throw new Error(data.error || "STT failed");
          const text = (data.text ?? "").trim();
          if (text) onTranscript(text);
          else toast.error("I couldn't catch that. Try speaking closer.");
        } catch (err: any) {
          toast.error(err?.message ?? "Transcription failed.");
        } finally {
          setState("idle");
        }
      };
      recorderRef.current = rec;
      rec.start();
      setState("recording");
    } catch {
      toast.error("Microphone permission is needed to use voice.");
    }
  }

  function stop() {
    recorderRef.current?.stop();
  }

  const busy = state !== "idle";
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={state === "recording" ? stop : start}
      aria-label={state === "recording" ? "Stop recording" : "Start voice input"}
      className="relative inline-flex items-center justify-center rounded-full text-primary-foreground transition-all focus:outline-none focus:ring-2 focus:ring-[var(--ring)] disabled:opacity-50"
      style={{
        width: size,
        height: size,
        backgroundColor:
          state === "recording" ? "var(--destructive)" : "var(--trust)",
      }}
    >
      {state === "recording" && (
        <>
          <span
            className="absolute inset-0 animate-ping rounded-full opacity-60"
            style={{ backgroundColor: "var(--destructive)" }}
          />
          <span
            className="absolute -inset-2 animate-pulse rounded-full opacity-30"
            style={{ backgroundColor: "var(--destructive)" }}
          />
        </>
      )}
      {state === "idle" && (
        <span
          className="absolute inset-0 rounded-full opacity-20"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, oklch(0.78 0.16 65 / 0.6), transparent 60%)",
          }}
        />
      )}
      {state === "processing" ? (
        <Loader2 className="relative h-6 w-6 animate-spin" />
      ) : state === "recording" ? (
        <Square className="relative h-5 w-5" fill="currentColor" />
      ) : (
        <Mic className="relative h-6 w-6" />
      )}
      <span className="sr-only">{busy ? state : "start recording"}</span>
    </button>
  );
}