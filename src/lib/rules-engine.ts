// Deterministic eligibility & scoring engine for SAARTHI schemes.
// Pure TypeScript, no server dependencies. Also used to build the
// Explanation Envelope for every recommendation.

export type ProfileFacts = {
  age?: number | null;
  gender?: string | null;
  state?: string | null;
  district?: string | null;
  occupation?: string | null;
  monthly_income?: number | null;
  education?: string | null;
  marital_status?: string | null;
  category?: string | null;
  has_disability?: boolean | null;
  household_size?: number | null;
  household_type?: string | null;
};

export type FamilyMember = {
  age?: number | null;
  gender?: string | null;
  occupation?: string | null;
  monthly_income?: number | null;
  has_disability?: boolean | null;
  relationship?: string | null;
};

export type Scheme = {
  id: string;
  name: string;
  short_name?: string | null;
  category: string;
  level: string;
  summary: string;
  benefits: string[];
  eligibility: Record<string, any>;
  required_documents: string[];
  next_step: string;
  official_url: string;
  ministry?: string | null;
  tags: string[];
  trust_note?: string | null;
};

export type EnvelopeReason = { label: string; passed: boolean; note?: string };

export type Recommendation = {
  scheme: Scheme;
  matchedFor: "you" | { name: string; relationship: string };
  score: number; // 0..1
  confidence: "high" | "medium" | "low";
  why_recommended: string;
  why_eligible: EnvelopeReason[];
  gaps: string[]; // missing info that would strengthen match
};

type Elig = {
  age?: { min?: number; max?: number };
  gender?: string[];
  category?: string[];
  occupations?: string[];
  monthly_income_max?: number;
  household_type?: string;
  has_disability?: boolean;
  marital_status?: string[];
  pregnancy?: boolean;
  student?: boolean;
  child_age?: { min?: number; max?: number };
  class_range?: [number, number];
  landholding?: string;
  secc_beneficiary?: boolean;
  nfsa_beneficiary?: boolean;
  education_min?: string;
};

function asElig(e: unknown): Elig {
  return (e ?? {}) as Elig;
}

function scorePerson(
  scheme: Scheme,
  p: ProfileFacts,
  isSelf: boolean,
): Omit<Recommendation, "scheme" | "matchedFor"> | null {
  const e = asElig(scheme.eligibility);
  const reasons: EnvelopeReason[] = [];
  const gaps: string[] = [];
  let matched = 0;
  let checks = 0;
  let hardFail = false;

  const has = <T>(v: T | null | undefined): v is T =>
    v !== null && v !== undefined && (typeof v !== "string" || v.length > 0);

  if (e.age) {
    checks++;
    if (!has(p.age)) {
      gaps.push("your age");
      reasons.push({ label: `Age ${fmtRange(e.age)}`, passed: false, note: "We don't know your age yet." });
    } else {
      const okMin = e.age.min == null || p.age! >= e.age.min;
      const okMax = e.age.max == null || p.age! <= e.age.max;
      const ok = okMin && okMax;
      if (ok) matched++;
      else hardFail = true;
      reasons.push({ label: `Age ${fmtRange(e.age)}`, passed: ok, note: `You are ${p.age}.` });
    }
  }
  if (e.gender && e.gender.length) {
    checks++;
    if (!has(p.gender)) {
      gaps.push("your gender");
      reasons.push({ label: `For ${e.gender.join("/")}`, passed: false, note: "Not on file." });
    } else {
      const ok = e.gender.includes(p.gender!.toLowerCase());
      if (ok) matched++;
      else hardFail = true;
      reasons.push({ label: `For ${e.gender.join("/")}`, passed: ok });
    }
  }
  if (e.occupations && e.occupations.length) {
    checks++;
    const occ = p.occupation?.toLowerCase() ?? "";
    if (!occ) {
      gaps.push("your occupation");
      reasons.push({ label: `Occupation ${e.occupations.join(", ")}`, passed: false });
    } else {
      const ok = e.occupations.some((o) => occ.includes(o.replace("_", " ")) || occ.includes(o));
      if (ok) matched++;
      reasons.push({ label: `Occupation ${e.occupations.join(", ")}`, passed: ok, note: `You: ${p.occupation}` });
      if (!ok && scheme.category !== "insurance" && scheme.category !== "banking") hardFail = true;
    }
  }
  if (e.monthly_income_max != null) {
    checks++;
    if (!has(p.monthly_income)) {
      gaps.push("monthly household income");
      reasons.push({ label: `Income ≤ ₹${e.monthly_income_max.toLocaleString("en-IN")}/mo`, passed: false });
    } else {
      const ok = p.monthly_income! <= e.monthly_income_max;
      if (ok) matched++;
      else hardFail = true;
      reasons.push({
        label: `Income ≤ ₹${e.monthly_income_max.toLocaleString("en-IN")}/mo`,
        passed: ok,
        note: `You: ₹${Number(p.monthly_income).toLocaleString("en-IN")}`,
      });
    }
  }
  if (e.category && e.category.length) {
    checks++;
    if (!has(p.category)) {
      gaps.push("social category (General/OBC/SC/ST/Minority)");
      reasons.push({ label: `Category ${e.category.join("/")}`, passed: false });
    } else {
      const ok = e.category.includes(p.category!.toLowerCase());
      if (ok) matched++;
      else hardFail = true;
      reasons.push({ label: `Category ${e.category.join("/")}`, passed: ok, note: `You: ${p.category}` });
    }
  }
  if (e.has_disability) {
    checks++;
    const ok = !!p.has_disability;
    if (ok) matched++;
    else hardFail = true;
    reasons.push({ label: "Person with disability (80%+)", passed: ok });
  }
  if (e.marital_status && e.marital_status.length) {
    checks++;
    if (!has(p.marital_status)) {
      gaps.push("marital status");
      reasons.push({ label: `Marital status ${e.marital_status.join("/")}`, passed: false });
    } else {
      const ok = e.marital_status.includes(p.marital_status!.toLowerCase());
      if (ok) matched++;
      else hardFail = true;
      reasons.push({ label: `Marital status ${e.marital_status.join("/")}`, passed: ok });
    }
  }
  if (e.household_type) {
    checks++;
    if (!has(p.household_type)) {
      gaps.push("rural or urban household");
      reasons.push({ label: `${e.household_type} household`, passed: false });
    } else {
      const ok = p.household_type === e.household_type;
      if (ok) matched++;
      else hardFail = true;
      reasons.push({ label: `${e.household_type} household`, passed: ok });
    }
  }
  if (e.secc_beneficiary) {
    // assumed possible if income low; soft signal
    checks++;
    const income = p.monthly_income ?? null;
    const ok = income != null && income <= 15000;
    if (ok) matched++;
    reasons.push({
      label: "SECC / BPL eligibility",
      passed: ok,
      note: ok ? "Your reported income suggests likely eligibility." : "Verification needed at local office.",
    });
  }
  if (e.nfsa_beneficiary) {
    checks++;
    reasons.push({
      label: "Ration card holder",
      passed: true,
      note: "Confirm with your local Fair Price Shop.",
    });
    matched++;
  }

  // baseline: if no checks (universal), score by tag relevance
  if (checks === 0) {
    checks = 1;
    matched = 1;
    reasons.push({ label: "Open to eligible citizens", passed: true });
  }

  if (hardFail && matched / checks < 0.4) return null;

  const rawScore = matched / Math.max(checks, 1);
  const gapPenalty = Math.min(0.35, gaps.length * 0.12);
  const score = Math.max(0.15, Math.min(1, rawScore - gapPenalty));
  const confidence: Recommendation["confidence"] =
    score >= 0.75 && gaps.length === 0 ? "high" : score >= 0.5 ? "medium" : "low";

  const why = buildWhy(scheme, p, isSelf);

  return {
    score,
    confidence,
    why_recommended: why,
    why_eligible: reasons,
    gaps,
  };
}

function fmtRange(r: { min?: number; max?: number }) {
  if (r.min != null && r.max != null) return `${r.min}–${r.max}`;
  if (r.min != null) return `${r.min}+`;
  if (r.max != null) return `≤${r.max}`;
  return "any";
}

function buildWhy(scheme: Scheme, p: ProfileFacts, isSelf: boolean) {
  const who = isSelf ? "you" : "them";
  const bits: string[] = [];
  const e = asElig(scheme.eligibility);
  if (e.occupations && p.occupation) bits.push(`${p.occupation}s like ${who}`);
  if (e.age && p.age) bits.push(`age ${p.age}`);
  if (e.gender && p.gender) bits.push(p.gender);
  if (e.category && p.category) bits.push(p.category);
  if (e.has_disability) bits.push("person with disability");
  if (e.marital_status && p.marital_status) bits.push(p.marital_status);
  const because = bits.length ? bits.join(", ") : (isSelf ? "your profile" : "their profile");
  return `Matches ${because}. This scheme provides ${scheme.benefits[0]?.toLowerCase() ?? "targeted support"}.`;
}

export function recommend(
  schemes: Scheme[],
  profile: ProfileFacts,
  family: FamilyMember[] = [],
): Recommendation[] {
  const out: Recommendation[] = [];
  for (const s of schemes) {
    const selfScore = scorePerson(s, profile, true);
    if (selfScore) out.push({ scheme: s, matchedFor: "you", ...selfScore });

    for (const m of family) {
      const memberFacts: ProfileFacts = {
        age: m.age ?? null,
        gender: m.gender ?? null,
        occupation: m.occupation ?? null,
        monthly_income: m.monthly_income ?? profile.monthly_income ?? null,
        has_disability: m.has_disability ?? false,
        category: profile.category ?? null,
        state: profile.state ?? null,
        household_type: profile.household_type ?? null,
        marital_status: null,
      };
      const memberScore = scorePerson(s, memberFacts, false);
      if (memberScore && memberScore.score > 0.55) {
        out.push({
          scheme: s,
          matchedFor: { name: (m as any).name ?? "family member", relationship: m.relationship ?? "family" },
          ...memberScore,
        });
      }
    }
  }
  // dedupe by scheme+matchedFor, keep best score
  const key = (r: Recommendation) =>
    r.scheme.id + "|" + (typeof r.matchedFor === "string" ? "self" : (r.matchedFor as any).name);
  const best = new Map<string, Recommendation>();
  for (const r of out) {
    const k = key(r);
    const prev = best.get(k);
    if (!prev || r.score > prev.score) best.set(k, r);
  }
  return [...best.values()].sort((a, b) => b.score - a.score);
}

export function profileCompleteness(p: ProfileFacts): number {
  const fields = [
    p.age,
    p.gender,
    p.state,
    p.occupation,
    p.monthly_income,
    p.category,
    p.marital_status,
    p.household_type,
  ];
  const filled = fields.filter((v) => v !== null && v !== undefined && v !== "").length;
  return Math.round((filled / fields.length) * 100);
}