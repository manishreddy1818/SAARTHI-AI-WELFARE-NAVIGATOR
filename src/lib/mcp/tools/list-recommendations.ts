import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { recommend, type ProfileFacts, type Scheme } from "@/lib/rules-engine";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_recommendations",
  title: "List recommended welfare schemes",
  description:
    "Return welfare schemes the signed-in citizen may qualify for, ranked by the SAARTHI rules engine using their profile and family details.",
  inputSchema: {
    limit: z.number().int().min(1).max(20).default(10).describe("Max schemes to return (1-20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const [{ data: schemes }, { data: profile }, { data: family }] = await Promise.all([
      supabase.from("schemes").select("*"),
      supabase.from("profiles").select("*").eq("id", ctx.getUserId()).maybeSingle(),
      supabase.from("family_members").select("*").eq("user_id", ctx.getUserId()),
    ]);
    const recs = recommend(
      (schemes ?? []) as unknown as Scheme[],
      (profile ?? {}) as ProfileFacts,
      (family ?? []) as any,
    ).slice(0, limit);
    return {
      content: [{ type: "text", text: JSON.stringify(recs, null, 2) }],
      structuredContent: { recommendations: recs },
    };
  },
});