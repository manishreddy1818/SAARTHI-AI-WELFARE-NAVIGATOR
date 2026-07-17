/**
 * SAARTHI Action Plan
 * -------------------
 * Types + deterministic builder for a per-application step-by-step plan.
 * Kept framework-agnostic so server functions and client UI can share it.
 */

export type ActionStepWhen = "today" | "next" | "later";
export type ActionStepType = "document" | "visit" | "apply" | "verify" | "wait";
export type ActionStepStatus = "todo" | "done" | "skipped";

export type ActionStep = {
  step_no: number;
  title: string;
  detail?: string;
  type: ActionStepType;
  when: ActionStepWhen;
  estimated_time?: string;
  location?: string;
  prerequisites?: string[];
  expected_benefit_after?: string;
  status: ActionStepStatus;
};

export type ActionPlan = {
  version: 1;
  generated_at: string;
  steps: ActionStep[];
};

/**
 * Deterministic fallback builder — used when the LLM refinement is
 * unavailable or fails. Also used as the base the LLM refines.
 */
export function buildDeterministicPlan(scheme: {
  name: string;
  required_documents?: string[] | null;
  next_step?: string | null;
  official_url?: string | null;
}): ActionPlan {
  const docs = (scheme.required_documents ?? []).slice(0, 6);
  const steps: ActionStep[] = [];
  let n = 1;

  for (let i = 0; i < docs.length; i++) {
    const d = docs[i];
    steps.push({
      step_no: n++,
      title: `Keep ${d} ready`,
      detail: `Have a clear photo or scan of your ${d}. If missing, apply for it first.`,
      type: "document",
      when: i === 0 ? "today" : "next",
      estimated_time: "15–30 min",
      status: "todo",
    });
  }

  steps.push({
    step_no: n++,
    title: `Verify eligibility for ${scheme.name}`,
    detail: "Re-check your details on the SAARTHI eligibility card so nothing is missing.",
    type: "verify",
    when: "next",
    estimated_time: "10 min",
    status: "todo",
  });

  steps.push({
    step_no: n++,
    title: scheme.next_step ?? "Apply on the official portal",
    detail: scheme.official_url
      ? `Open the ministry portal and start your application. Save the reference number.`
      : "Apply through the nearest Common Service Centre (CSC) or the ministry portal.",
    type: "apply",
    when: "next",
    location: scheme.official_url ?? "Nearest CSC / Panchayat / Ward office",
    estimated_time: "20–40 min",
    status: "todo",
  });

  steps.push({
    step_no: n++,
    title: "Track approval",
    detail: "Note the application ID. Check status weekly and update it in SAARTHI.",
    type: "wait",
    when: "later",
    estimated_time: "2 min / week",
    status: "todo",
  });

  return {
    version: 1,
    generated_at: new Date().toISOString(),
    steps,
  };
}

/**
 * Best-effort validator for LLM-returned plans. Fills in step_no/status
 * defaults and drops anything malformed.
 */
export function normalizePlan(raw: unknown): ActionPlan | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as any;
  const arr = Array.isArray(r.steps) ? r.steps : [];
  const steps: ActionStep[] = [];
  arr.forEach((s: any, i: number) => {
    if (!s || typeof s !== "object") return;
    const title = typeof s.title === "string" ? s.title.trim() : "";
    if (!title) return;
    const type: ActionStepType = ["document", "visit", "apply", "verify", "wait"].includes(s.type)
      ? s.type
      : "apply";
    const when: ActionStepWhen = ["today", "next", "later"].includes(s.when) ? s.when : "next";
    const status: ActionStepStatus = ["todo", "done", "skipped"].includes(s.status) ? s.status : "todo";
    steps.push({
      step_no: i + 1,
      title,
      detail: typeof s.detail === "string" ? s.detail : undefined,
      type,
      when,
      estimated_time: typeof s.estimated_time === "string" ? s.estimated_time : undefined,
      location: typeof s.location === "string" ? s.location : undefined,
      prerequisites: Array.isArray(s.prerequisites)
        ? s.prerequisites.filter((p: any) => typeof p === "string").slice(0, 5)
        : undefined,
      expected_benefit_after:
        typeof s.expected_benefit_after === "string" ? s.expected_benefit_after : undefined,
      status,
    });
  });
  if (steps.length === 0) return null;
  return { version: 1, generated_at: new Date().toISOString(), steps };
}