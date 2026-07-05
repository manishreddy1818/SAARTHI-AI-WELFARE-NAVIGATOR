import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { chatJSON, type ChatTurn } from "./ai-gateway.server";
import {
  recommend,
  type ProfileFacts,
  type Scheme,
  type Recommendation,
} from "./rules-engine";

const citizenPatch = z.object({
  id: z.string().uuid().optional(),
  full_name: z.string().min(1).max(120),
  mobile: z.string().max(20).nullish(),
  age: z.number().int().min(0).max(120).nullish(),
  gender: z.enum(["female", "male", "other"]).nullish(),
  state: z.string().max(80).nullish(),
  district: z.string().max(80).nullish(),
  occupation: z.string().max(120).nullish(),
  monthly_income: z.number().min(0).nullish(),
  education: z.string().max(80).nullish(),
  marital_status: z.enum(["single", "married", "widow", "divorced"]).nullish(),
  category: z.enum(["general", "obc", "sc", "st", "minority"]).nullish(),
  has_disability: z.boolean().nullish(),
  household_size: z.number().int().min(1).max(30).nullish(),
  household_type: z.enum(["rural", "urban"]).nullish(),
  preferred_language: z.string().max(40).nullish(),
  notes: z.string().max(2000).nullish(),
});

function stripNulls<T extends Record<string, any>>(row: T): T {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(row)) if (v !== null && v !== undefined) out[k] = v;
  return out as T;
}

export const partnerStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("partner_citizens" as any)
      .select("estimated_benefits, applications_started, applications_completed, status")
      .eq("partner_id", context.userId);
    if (error) throw error;
    const rows = (data ?? []) as any[];
    const total = rows.length;
    const benefits = rows.reduce((a, r) => a + Number(r.estimated_benefits ?? 0), 0);
    const started = rows.reduce((a, r) => a + Number(r.applications_started ?? 0), 0);
    const completed = rows.reduce((a, r) => a + Number(r.applications_completed ?? 0), 0);
    const followUp = rows.filter((r) => r.status !== "completed").length;
    return { total, benefits, started, completed, followUp };
  });

export const listPartnerCitizens = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z
      .object({
        query: z.string().max(120).optional(),
        status: z
          .enum([
            "need_documents",
            "application_submitted",
            "waiting_approval",
            "benefit_received",
            "completed",
          ])
          .optional(),
        district: z.string().max(80).optional(),
      })
      .parse(v ?? {}),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("partner_citizens" as any)
      .select("*")
      .eq("partner_id", context.userId)
      .order("last_activity_at", { ascending: false })
      .limit(100);
    if (data.query) {
      const like = `%${data.query}%`;
      q = q.or(`full_name.ilike.${like},mobile.ilike.${like},district.ilike.${like}`);
    }
    if (data.status) q = q.eq("status", data.status);
    if (data.district) q = q.ilike("district", `%${data.district}%`);
    const { data: rows, error } = await q;
    if (error) throw error;
    return (rows ?? []) as any[];
  });

export const getPartnerCitizen = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const [{ data: citizen, error: cErr }, { data: family, error: fErr }, { data: schemes }] =
      await Promise.all([
        context.supabase
          .from("partner_citizens" as any)
          .select("*")
          .eq("id", data.id)
          .eq("partner_id", context.userId)
          .maybeSingle(),
        context.supabase
          .from("partner_citizen_family" as any)
          .select("*")
          .eq("citizen_id", data.id)
          .eq("partner_id", context.userId),
        context.supabase.from("schemes").select("*"),
      ]);
    if (cErr) throw cErr;
    if (fErr) throw fErr;
    if (!citizen) throw new Error("Citizen not found");
    const recs: Recommendation[] = recommend(
      (schemes ?? []) as unknown as Scheme[],
      citizen as ProfileFacts,
      (family ?? []) as any,
    );
    return { citizen: citizen as any, family: (family ?? []) as any[], recommendations: recs.slice(0, 12) };
  });

export const upsertPartnerCitizen = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => citizenPatch.parse(v))
  .handler(async ({ data, context }) => {
    const row = stripNulls({ ...data, partner_id: context.userId, last_activity_at: new Date().toISOString() });
    const { data: saved, error } = await context.supabase
      .from("partner_citizens" as any)
      .upsert(row)
      .select("id")
      .single();
    if (error) throw error;
    return { id: (saved as any).id as string };
  });

export const updateFollowUp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum([
          "need_documents",
          "application_submitted",
          "waiting_approval",
          "benefit_received",
          "completed",
        ]),
        estimated_benefits: z.number().min(0).optional(),
        notes: z.string().max(2000).nullish(),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    const patch: Record<string, any> = {
      status: data.status,
      last_activity_at: new Date().toISOString(),
    };
    if (data.estimated_benefits != null) patch.estimated_benefits = data.estimated_benefits;
    if (data.notes != null) patch.notes = data.notes;
    if (data.status === "application_submitted") patch.applications_started = 1;
    if (data.status === "completed" || data.status === "benefit_received")
      patch.applications_completed = 1;
    const { error } = await context.supabase
      .from("partner_citizens" as any)
      .update(patch)
      .eq("id", data.id)
      .eq("partner_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

// Extract structured citizen facts from a free-text intake narrative (voice or typed).
const EXTRACT_PROMPT = `You extract structured citizen facts for a welfare-scheme discovery system in India.
Given the intake narrative, return STRICT JSON:
{
  "full_name": string | null,
  "age": number | null,
  "gender": "female" | "male" | "other" | null,
  "state": string | null,
  "district": string | null,
  "occupation": string | null,
  "monthly_income": number | null,
  "category": "general" | "obc" | "sc" | "st" | "minority" | null,
  "marital_status": "single" | "married" | "widow" | "divorced" | null,
  "has_disability": boolean | null,
  "household_type": "rural" | "urban" | null,
  "household_size": number | null,
  "notes": string | null,
  "summary": string
}
Rules:
- Only fill fields explicitly stated or clearly implied. Otherwise use null.
- monthly_income is in Indian Rupees per month.
- "summary" is one warm sentence describing the citizen for a welfare partner.`;

export const extractIntake = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ text: z.string().min(2).max(4000) }).parse(v))
  .handler(async ({ data }) => {
    const messages: ChatTurn[] = [
      { role: "system", content: EXTRACT_PROMPT },
      { role: "user", content: data.text },
    ];
    try {
      const parsed = await chatJSON<Record<string, any>>({ messages, temperature: 0.1 });
      return { ok: true as const, extracted: parsed };
    } catch (e: any) {
      return { ok: false as const, error: e?.message ?? "extract_failed" };
    }
  });

export const deletePartnerCitizen = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("partner_citizens" as any)
      .delete()
      .eq("id", data.id)
      .eq("partner_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });