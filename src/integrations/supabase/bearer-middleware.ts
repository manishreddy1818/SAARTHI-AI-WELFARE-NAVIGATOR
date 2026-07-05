import { createMiddleware } from "@tanstack/react-start";
import { supabase } from "./client";

// Project-specific bearer attacher. More robust than the generated one:
// - Awaits Supabase session hydration on cold start (localStorage race).
// - Falls back to reading the token directly from localStorage.
// - Attempts a short retry if no session is available yet.
async function readToken(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    const t = data.session?.access_token;
    if (t) return t;
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k || !k.startsWith("sb-") || !k.endsWith("-auth-token")) continue;
        const raw = localStorage.getItem(k);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        const t = parsed?.access_token ?? parsed?.currentSession?.access_token;
        if (t) return t as string;
      }
    } catch {
      /* ignore */
    }
  }
  return null;
}

export const attachSupabaseBearer = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    let token = await readToken();
    if (!token) {
      // Brief retry to survive first-render race after OAuth redirect.
      await new Promise((r) => setTimeout(r, 150));
      token = await readToken();
    }
    return next({ headers: token ? { Authorization: `Bearer ${token}` } : {} });
  },
);