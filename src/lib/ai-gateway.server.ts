// Server-only helper for calling Lovable AI Gateway.
// Keep this file server-only; imported from server-fn handlers or server routes.

export const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1";

export function assertServerKey(): string {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY on the server.");
  return key;
}

export type ChatTurn = { role: "system" | "user" | "assistant"; content: string };

export async function chatJSON<T>(opts: {
  model?: string;
  messages: ChatTurn[];
  temperature?: number;
}): Promise<T> {
  const key = assertServerKey();
  const model = opts.model ?? "google/gemini-3-flash-preview";
  const res = await fetch(`${LOVABLE_AI_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: opts.messages,
      temperature: opts.temperature ?? 0.4,
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`AI Gateway ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    choices: { message: { content: string } }[];
  };
  const raw = data.choices?.[0]?.message?.content ?? "{}";
  try {
    return JSON.parse(raw) as T;
  } catch {
    // strip code fences if the model returned any
    const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
    return JSON.parse(cleaned) as T;
  }
}