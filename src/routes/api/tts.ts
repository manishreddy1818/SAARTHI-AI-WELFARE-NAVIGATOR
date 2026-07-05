import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        let text = "";
        let voice = "alloy";
        let instructions: string | undefined;
        try {
          const body = (await request.json()) as { text?: string; voice?: string; instructions?: string };
          text = (body.text ?? "").slice(0, 2500);
          if (body.voice) voice = body.voice;
          if (body.instructions) instructions = body.instructions.slice(0, 500);
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }
        if (!text.trim()) return new Response("text required", { status: 400 });

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "openai/gpt-4o-mini-tts",
            input: text,
            voice,
            ...(instructions ? { instructions } : {}),
            response_format: "mp3",
          }),
        });
        if (!upstream.ok) {
          const err = await upstream.text().catch(() => "");
          return new Response(err || "TTS failed", { status: upstream.status });
        }
        return new Response(upstream.body, {
          headers: {
            "Content-Type": "audio/mpeg",
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});