import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { chatJSON, type ChatTurn } from "./ai-gateway.server";
import { recommend, profileCompleteness, type ProfileFacts, type Scheme } from "./rules-engine";

// ---------------- Profile ----------------

const profilePatch = z.object({
  full_name: z.string().nullish(),
  age: z.number().int().min(0).max(120).nullish(),
  gender: z.enum(["female", "male", "other"]).nullish(),
  state: z.string().nullish(),
  district: z.string().nullish(),
  occupation: z.string().nullish(),
  monthly_income: z.number().min(0).nullish(),
  education: z.string().nullish(),
  marital_status: z.enum(["single", "married", "widow", "divorced"]).nullish(),
  category: z.enum(["general", "obc", "sc", "st", "minority"]).nullish(),
  has_disability: z.boolean().nullish(),
  household_size: z.number().int().min(1).max(30).nullish(),
  household_type: z.enum(["rural", "urban"]).nullish(),
  preferred_language: z.string().nullish(),
});
export type ProfilePatch = z.infer<typeof profilePatch>;

export const getProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => profilePatch.parse(v))
  .handler(async ({ data, context }) => {
    const cleaned: Record<string, any> = {};
    for (const [k, v] of Object.entries(data)) if (v !== null && v !== undefined) cleaned[k] = v;
    if (Object.keys(cleaned).length === 0) return { ok: true };

    // recompute completeness
    const { data: current } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("id", context.userId)
      .maybeSingle();
    const merged = { ...(current ?? {}), ...cleaned } as ProfileFacts;
    const completeness = profileCompleteness(merged);
    cleaned.profile_completeness = completeness;
    cleaned.onboarding_done = completeness >= 50;

    const { error } = await context.supabase
      .from("profiles")
      .update(cleaned)
      .eq("id", context.userId);
    if (error) throw error;
    return { ok: true, completeness };
  });

// ---------------- Family ----------------

const familyInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  relationship: z.string().min(1),
  age: z.number().int().min(0).max(120).nullish(),
  gender: z.enum(["female", "male", "other"]).nullish(),
  occupation: z.string().nullish(),
  monthly_income: z.number().min(0).nullish(),
  has_disability: z.boolean().nullish(),
  notes: z.string().nullish(),
});

export const listFamily = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("family_members")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  });

export const upsertFamily = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => familyInput.parse(v))
  .handler(async ({ data, context }) => {
    const row: Record<string, any> = { ...data, user_id: context.userId };
    for (const k of Object.keys(row)) if (row[k] === null) delete row[k];
    const { error } = await context.supabase.from("family_members").upsert(row);
    if (error) throw error;
    return { ok: true };
  });

export const deleteFamily = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("family_members")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

// ---------------- Documents ----------------

const docInput = z.object({
  id: z.string().uuid().optional(),
  doc_type: z.string().min(1),
  label: z.string().min(1),
  status: z.enum(["missing", "have", "verified"]),
  notes: z.string().nullish(),
});

export const listDocuments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("documents")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  });

export const upsertDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => docInput.parse(v))
  .handler(async ({ data, context }) => {
    const row: Record<string, any> = { ...data, user_id: context.userId };
    for (const k of Object.keys(row)) if (row[k] === null) delete row[k];
    const { error } = await context.supabase.from("documents").upsert(row);
    if (error) throw error;
    return { ok: true };
  });

export const deleteDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("documents")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

// ---------------- Saved schemes & Applications ----------------

export const toggleSaved = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ scheme_id: z.string() }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase
      .from("saved_schemes")
      .select("id")
      .eq("user_id", context.userId)
      .eq("scheme_id", data.scheme_id)
      .maybeSingle();
    if (existing) {
      await context.supabase.from("saved_schemes").delete().eq("id", existing.id);
      return { saved: false };
    }
    const { error } = await context.supabase
      .from("saved_schemes")
      .insert({ user_id: context.userId, scheme_id: data.scheme_id });
    if (error) throw error;
    return { saved: true };
  });

export const listSaved = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("saved_schemes")
      .select("scheme_id")
      .eq("user_id", context.userId);
    if (error) throw error;
    return (data ?? []).map((r) => r.scheme_id as string);
  });

const appInput = z.object({
  scheme_id: z.string(),
  status: z.enum(["saved", "in_progress", "submitted", "approved", "rejected"]),
  notes: z.string().nullish(),
});

export const upsertApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => appInput.parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("applications")
      .upsert(
        { ...data, user_id: context.userId },
        { onConflict: "user_id,scheme_id" },
      );
    if (error) throw error;
    return { ok: true };
  });

export const listApplications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("applications")
      .select("*, schemes!inner(id,name,short_name,category,summary,official_url)")
      .eq("user_id", context.userId)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

// ---------------- Schemes ----------------

export const listAllSchemes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("schemes").select("*").order("name");
    if (error) throw error;
    return (data ?? []) as any as Scheme[];
  });

export const getScheme = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string() }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("schemes")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw error;
    return row as any as Scheme | null;
  });

// ---------------- Recommendations (deterministic rules engine) ----------------

export const getRecommendations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: schemes }, { data: profile }, { data: family }] = await Promise.all([
      context.supabase.from("schemes").select("*"),
      context.supabase.from("profiles").select("*").eq("id", context.userId).maybeSingle(),
      context.supabase.from("family_members").select("*").eq("user_id", context.userId),
    ]);
    const recs = recommend((schemes ?? []) as unknown as Scheme[], (profile ?? {}) as ProfileFacts, (family ?? []) as any);
    return {
      profile,
      recommendations: recs.slice(0, 20) as any,
      completeness: profileCompleteness((profile ?? {}) as ProfileFacts),
    };
  });

// ---------------- Chat (SAARTHI AI conversation) ----------------

const sendMessageInput = z.object({
  conversation_id: z.string().uuid().nullable().optional(),
  text: z.string().min(1).max(2000),
});

const SYSTEM_PROMPT = `You are SAARTHI — a warm, patient AI companion helping Indian citizens discover government welfare schemes they qualify for.

Rules:
- Be brief, kind, and specific. Ask ONE gentle question at a time when you need more info.
- Speak simply. Avoid jargon.
- Never invent schemes; when suggesting benefits, name real Indian schemes only (e.g. PM-KISAN, PMJAY, Ujjwala, PMAY, IGNOAPS, PMMVY, e-Shram, Mudra, PM Vishwakarma).
- If the user shares personal facts (age, gender, occupation, income, state, category, marital status, disability, rural/urban), extract them into "profile_updates".
- Use only these keys in profile_updates: age (number), gender ("female"|"male"|"other"), state (string), occupation (string), monthly_income (number in ₹), category ("general"|"obc"|"sc"|"st"|"minority"), marital_status ("single"|"married"|"widow"|"divorced"), has_disability (boolean), household_type ("rural"|"urban"), household_size (number).
- Omit any key you're not sure about.

You MUST respond with a single JSON object matching:
{ "reply": string, "profile_updates": object, "suggested_prompts": string[] }

"suggested_prompts" is 2–3 short next-step replies the citizen could tap.`;

function buildProfileSummary(p: any) {
  if (!p) return "Profile: (empty)";
  const bits: string[] = [];
  if (p.age) bits.push(`age ${p.age}`);
  if (p.gender) bits.push(String(p.gender));
  if (p.occupation) bits.push(String(p.occupation));
  if (p.state) bits.push(String(p.state));
  if (p.monthly_income != null) bits.push(`₹${p.monthly_income}/mo`);
  if (p.category) bits.push(`category ${p.category}`);
  if (p.marital_status) bits.push(String(p.marital_status));
  if (p.household_type) bits.push(`${p.household_type} household`);
  if (p.has_disability) bits.push("has disability");
  return `Known profile: ${bits.length ? bits.join(", ") : "(nothing yet)"}`;
}

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => sendMessageInput.parse(v))
  .handler(async ({ data, context }) => {
    // 1. Ensure conversation
    let convId = data.conversation_id ?? null;
    if (!convId) {
      const { data: c, error } = await context.supabase
        .from("conversations")
        .insert({ user_id: context.userId, title: data.text.slice(0, 60) })
        .select("id")
        .single();
      if (error) throw error;
      convId = c.id;
    }

    // 2. Insert user message
    await context.supabase.from("chat_messages").insert({
      conversation_id: convId,
      user_id: context.userId,
      role: "user",
      content: data.text,
    });

    // 3. Load history + profile
    const [{ data: history }, { data: profile }] = await Promise.all([
      context.supabase
        .from("chat_messages")
        .select("role, content")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true })
        .limit(30),
      context.supabase.from("profiles").select("*").eq("id", context.userId).maybeSingle(),
    ]);

    const messages: ChatTurn[] = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "system", content: buildProfileSummary(profile) },
      ...((history ?? []).map((m) => ({
        role: (m.role === "assistant" ? "assistant" : "user") as "user" | "assistant",
        content: m.content as string,
      })) as ChatTurn[]),
    ];

    // 4. Call model
    let reply = "";
    let profile_updates: Record<string, unknown> = {};
    let suggested_prompts: string[] = [];
    try {
      const parsed = await chatJSON<{
        reply?: string;
        profile_updates?: Record<string, unknown>;
        suggested_prompts?: string[];
      }>({ messages });
      reply = parsed.reply?.trim() ?? "I'm here. Could you tell me a bit more?";
      profile_updates = parsed.profile_updates ?? {};
      suggested_prompts = Array.isArray(parsed.suggested_prompts)
        ? parsed.suggested_prompts.slice(0, 3)
        : [];
    } catch (err) {
      reply =
        "I couldn't reach the assistant just now. Please try again in a moment — your message is safe.";
    }

    // 5. Persist assistant reply
    await context.supabase.from("chat_messages").insert({
      conversation_id: convId,
      user_id: context.userId,
      role: "assistant",
      content: reply,
    });

    // 6. Apply profile updates if any
    let appliedUpdates: Record<string, unknown> = {};
    if (profile_updates && typeof profile_updates === "object") {
      const safe = profilePatch.safeParse(profile_updates);
      if (safe.success) {
        const cleaned: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(safe.data)) if (v !== null && v !== undefined) cleaned[k] = v;
        if (Object.keys(cleaned).length) {
          const merged = { ...(profile ?? {}), ...cleaned } as ProfileFacts;
          cleaned.profile_completeness = profileCompleteness(merged);
          cleaned.onboarding_done = (cleaned.profile_completeness as number) >= 50;
          await context.supabase.from("profiles").update(cleaned).eq("id", context.userId);
          appliedUpdates = cleaned;
        }
      }
    }

    // Touch conversation updated_at
    await context.supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", convId);

    return {
      conversation_id: convId,
      reply,
      suggested_prompts,
      profile_updates: appliedUpdates,
    };
  });

export const listConversations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("conversations")
      .select("id, title, updated_at")
      .eq("user_id", context.userId)
      .order("updated_at", { ascending: false })
      .limit(20);
    if (error) throw error;
    return data ?? [];
  });

export const getConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: messages, error } = await context.supabase
      .from("chat_messages")
      .select("id, role, content, created_at")
      .eq("conversation_id", data.id)
      .eq("user_id", context.userId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return messages ?? [];
  });