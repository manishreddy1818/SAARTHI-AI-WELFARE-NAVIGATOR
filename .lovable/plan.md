# SAARTHI Phase 1 — Grand Finale AI Upgrade Blueprint

Scope: planning only. No code, no files, no schema changes yet. This blueprint targets five upgrades that turn the existing chatbot into a true AI Welfare Assistant while reusing current infra (TanStack Start + Lovable AI Gateway + Supabase + existing `rules-engine.ts` and `citizen.functions.ts`).

---

## Feature 1 — Conversational Memory

**Purpose**
Make SAARTHI remember facts stated earlier in a conversation (occupation, state, family, disability, income) so it never re-asks and can reference them naturally later.

**User Experience**
- User says "I'm a farmer in Telangana" once. Next turn: "Since you farm in Telangana, PM-KISAN looks like a strong fit…"
- Returning users see "Welcome back — I still have your profile on file. Want me to re-check for new schemes?"

**AI Workflow (three memory layers)**
1. Short-term (turn window): full `UIMessage[]` for the active `conversations` row — already partially in place.
2. Structured working memory: a JSON "facts card" the model maintains per conversation (age, state, occupation, income, category, disability, family[]). Updated via a lightweight `update_profile_facts` tool call the model emits when new facts are detected.
3. Long-term: reconcile the facts card into `profiles` / `family_members` on confirmation ("Save this to your profile?"). Never silently overwrite user-entered profile fields.

Every model call receives: system prompt + compact facts card (rendered as bullet list) + last N messages (token-budgeted, older turns summarized by a cheap Gemini flash-lite pass).

**Backend Changes**
- New server fn `getConversationMemory(conversationId)` → returns `{ facts, summary, messages }`.
- New server fn `upsertConversationFacts(conversationId, partialFacts)`.
- Extend the chat handler to (a) inject memory into the system prompt, (b) run the model's `update_profile_facts` tool result back into the facts row, (c) after N turns, background-summarize older messages.

**Frontend Changes**
- Chat composer badge: "Remembers: farmer · Telangana · 2 dependents" with an "edit / forget" affordance.
- On assistant page mount, show a "Resuming your last conversation" chip if memory exists.

**Database Impact**
- New column on `conversations`: `facts jsonb default '{}'`, `summary text`, `summary_updated_at timestamptz`.
- Reuse `chat_messages` unchanged. RLS: user owns their conversation → memory follows same policy. Add GRANT block per existing conventions.

**API Impact**
- Chat streaming route gains a tool: `update_profile_facts(partial)`. No new public endpoint.
- Rules engine consumes the facts card as a `ProfileFacts` overlay when profile fields are missing.

**Risks**
- Hallucinated facts poisoning memory → require model to only write facts it can quote from the user; show diff before writing to `profiles`.
- Token bloat → hard cap facts card at ~400 tokens; summarize > 20 turns.
- Privacy → facts are per-user, RLS enforced, never sent to any non-Lovable AI endpoint.

**Success Criteria**
- Zero re-asks for a fact already stated in the same conversation (measured across a 10-turn scripted test).
- Assistant references at least one prior fact per response after turn 3.
- Facts card survives page reload and thread switch.

---

## Feature 2 — Human-like AI Personality

**Purpose**
Replace generic assistant tone with a warm, culturally aware welfare guide.

**User Experience**
Opening turn:
> "Namaste, Manish 👋 Welcome back. I remember you're a farmer in Warangal with two dependents. I found 3 schemes that may benefit your family today — want me to walk you through them?"

**Tone guidelines**
- Warm, respectful, plain language (grade-6 reading level in English; matches user's language when detected).
- Uses the user's name when known; falls back to "friend" — never "user".
- Namaste / greeting once per session, not per turn.
- Empathetic on hardship topics (disability, widow pensions) — never clinical.
- Ends most responses with one concrete next step or one clarifying question, not both.

**Personality rules**
- Confident but humble: "I think this fits — please double-check at MeeSeva."
- Never invents scheme names, benefit amounts, or URLs; if unsure, says so and offers to search.
- Uses Indian context defaults (₹, DD-MM-YYYY, state names, ministry names).
- No emojis in error/warning responses; ≤1 emoji elsewhere.

**Memory usage rules**
- Cite memory naturally, not robotically ("Since you mentioned…" not "Based on stored fact occupation=farmer").
- Ask before persisting a new fact to the long-term profile.
- If facts conflict (user says something new), confirm which is current before overwriting.

**Backend Changes**
- Single `SAARTHI_SYSTEM_PROMPT` constant in a server-only module, versioned. Includes tone, personality, memory rules, refusal rules, and the Explanation Envelope contract (Feature 3).

**Frontend Changes**
- Assistant header shows persona ("SAARTHI · your welfare guide"). Avatar + subtle status ("thinking", "reading your profile") tied to Feature 5.

**Database Impact**
- None (prompt lives in code).

**API Impact**
- All model calls use the shared system prompt. Enforced in the chat route and in `citizen.functions.ts` recommendation calls.

**Risks**
- Over-familiarity feeling patronizing → keep persona knobs adjustable via a single constants file, review with 3 sample personas (rural elder, urban student, PwD applicant).
- Model drift on Gemini flash → include 2 few-shot exemplars in the system prompt.

**Success Criteria**
- Human review: 8/10 sample responses rated "friendly and clear".
- Zero occurrences of "As an AI language model…" or similar meta phrases in a 50-prompt regression set.

---

## Feature 3 — Explainable AI Upgrade (Explanation Envelope)

**Purpose**
Every recommendation carries a structured, auditable explanation the UI can render deterministically.

**Envelope shape (contract; not code)**
- `scheme_id`, `scheme_name`
- `why_recommended` — 1–2 sentence plain-language reason
- `confidence` — `high | medium | low` + numeric `score` 0–1
- `matching_criteria[]` — `{ label, passed: true, evidence }`
- `missing_criteria[]` — `{ label, needed_value, current_value }`
- `missing_documents[]` — from `required_documents` minus documents already on file
- `estimated_benefit` — `{ amount_inr | in_kind, cadence, note }`
- `ai_reasoning` — short natural-language chain: facts → rule → conclusion
- `sources[]` — official URL(s) + last-verified date
- `next_step` — carried into Feature 4

**AI Workflow**
- Rules engine (`recommend()`) already emits `why_eligible`, `gaps`, `score`, `confidence`. Extend to also emit `missing_documents` (join with `documents` table) and `estimated_benefit` (parsed from `schemes.benefits`).
- A second, small LLM pass ("explainer") converts the deterministic envelope into the natural `why_recommended` and `ai_reasoning` strings using the system prompt from Feature 2. Deterministic fields are never model-generated.

**Backend Changes**
- Extend `Recommendation` type and `recommend()` output in `rules-engine.ts`.
- New server fn `explainRecommendation(recId)` → runs the explainer LLM pass on demand, cached in memory per conversation.
- `getRecommendations` returns envelopes; explainer text is fetched lazily when a card is expanded (keeps list fast).

**Frontend Changes**
- `SchemeCard` grows a "Why this?" expandable section rendering the envelope with clear sub-sections and a confidence bar.
- Missing criteria/documents show inline CTAs ("Add income", "Upload Aadhaar") linking to profile/documents pages.

**Database Impact**
- Optional: `applications.explanation jsonb` snapshot when the user saves a scheme (audit trail).
- Add `schemes.estimated_benefit jsonb` if we want structured amounts (nullable, backfill later).

**API Impact**
- Envelope schema exposed to MCP `list_recommendations` tool so external agents get the same structure.

**Risks**
- LLM explainer contradicting rules engine → explainer prompt is strictly "rewrite these facts", never "decide eligibility". Guardrail: reject explainer output if it introduces a criterion not present in the envelope (regex/set check).
- Envelope size on long lists → keep envelope compact; lazy-load `ai_reasoning`.

**Success Criteria**
- 100% of recommendations include all envelope fields (nulls allowed only for `estimated_benefit` with note).
- Judge test: pick any card → user can name the top 2 reasons in <5 seconds.

---

## Feature 4 — AI Action Plan

**Purpose**
Turn "you qualify" into a stepwise, trackable roadmap per scheme.

**Action Plan structure**
Ordered steps, each with:
- `step_no`, `title`, `type` (`document | visit | online | verification | disbursal`)
- `today | next | later` bucket
- `estimated_time` (e.g., "10 min", "3–5 working days")
- `location` (Aadhaar center / MeeSeva / online portal + URL)
- `prerequisites[]` (references to `missing_documents`)
- `expected_benefit_after` (partial or full)
- `status` (`pending | in_progress | done | blocked`) — user-editable
- `evidence[]` (uploaded receipts / acknowledgment IDs)

**User Experience**
Vertical stepper on the scheme detail page:
> Today's Action → Upload Aadhaar
> Next Step → Visit MeeSeva (est. 30 min)
> Processing → 7–14 days
> Expected Benefit → ₹6,000/year
> Status → Pending

Progress ring on the applications page; nudges ("You're 1 step away from ₹6,000/year").

**AI Workflow**
- Generate the plan once per (user, scheme) via a `generateActionPlan` server fn. Input: envelope + user's document set + state. Output: JSON action plan validated against a strict schema.
- Regenerate on demand or when a prerequisite is fulfilled (upload event).
- Model role is templating; the deterministic base (documents required, official URL, portal) comes from `schemes` and `documents` tables — not from the model.

**Backend Changes**
- New server fn `generateActionPlan(schemeId)` and `updateActionStep(applicationId, stepNo, status)`.
- Hook into existing `applications` flow: creating an application seeds its plan.

**Frontend Changes**
- New "Action Plan" section on `schemes.$id.tsx` and on the applications page.
- Stepper component with status toggles, document links, and a "Mark done" affordance.

**Database Impact**
- New table `application_action_plans` (application_id FK, steps jsonb, generated_at, model_version). RLS: owner-only. Full GRANT block per project rules.
- Or store `plan jsonb` directly on `applications` — simpler, chosen unless we need history.

**API Impact**
- MCP `list_applications` tool gains a `plan` field so agents can drive next steps.

**Risks**
- Model inventing offices/URLs → constrain via a whitelist derived from the scheme row; any URL not in whitelist is dropped.
- Stale plans after policy change → include `generated_at` and a "Refresh plan" button; invalidate when scheme row changes.

**Success Criteria**
- Every saved application has a plan within 3 seconds of save.
- ≥90% of steps map to a real document, portal, or verification action (spot-checked on 20 samples).

---

## Feature 5 — AI Thinking Experience

**Purpose**
Replace generic spinners with a realistic reasoning trace that mirrors actual backend work.

**User Experience**
Live status list while a recommendation or action plan is being computed:
- 🧠 Understanding your profile…
- 📄 Reading family information…
- 🔍 Checking eligibility across 200+ schemes…
- 📑 Matching central and state schemes…
- ✅ Preparing recommendations…

Each row transitions from active → done with a checkmark, tied to a real event, not a fake timer.

**AI Workflow**
- Chat + recommendation server fns emit progress events (Server-Sent Events on the chat route already streams; extend the streamed protocol with typed `status` parts).
- Client renders parts of type `status` as steps; assistant text parts continue as normal.
- The existing `AnalyzingSteps` component is upgraded from timer-driven to event-driven, keeping the same visual language but tied to true milestones: profile fetch, schemes fetch, rules-engine run, envelope build, explainer LLM call.

**Backend Changes**
- Chat route: interleave `data: { type: "status", label, state }` events in the UIMessage stream.
- `getRecommendations`: convert into a streamed server route (`/api/recs.stream`) or emit progress via a lightweight Supabase realtime channel; simplest is streaming.

**Frontend Changes**
- Replace `AnalyzingSteps` timer with subscription to the streamed status parts.
- Persist last "thinking trace" alongside the final answer so users can expand "How SAARTHI thought" post-hoc.

**Database Impact**
- Optional: store the trace on `chat_messages` as `metadata jsonb` for replay.

**API Impact**
- Public shape of the stream stays UIMessage-compatible; adds a new part type `status`. MCP unaffected.

**Risks**
- Fake-looking steps if backend is fast → merge steps under a threshold; never show a step that didn't run.
- Streaming compat on Cloudflare Workers — already used for chat, so proven.

**Success Criteria**
- Every visible step corresponds to a real backend milestone (audit via server logs).
- Perceived latency drops in user test even when actual latency is unchanged.

---

## Cross-cutting concerns

- Model choice: `google/gemini-3-flash-preview` for chat, explainer, and plan generation (default). Escalate to `google/gemini-3.1-pro-preview` only for the explainer when confidence < 0.5.
- Cost/latency budget per recommendation set: ≤ 2 model calls (rules → explainer; plan is on-demand).
- Security: all new server fns behind `requireSupabaseAuth`. New tables get RLS + GRANT in the same migration.
- Observability: log `{conversation_id, feature, model, tokens, latency_ms, error}` for every model call.
- Feature flags: ship each of the 5 behind a per-user flag on `profiles` so we can demo incrementally at the finale.

---

## Rollout order (proposed)

1. Personality + system prompt (Feature 2) — foundation, zero risk.
2. Explanation Envelope (Feature 3) — pure backend + card polish.
3. Conversational Memory (Feature 1) — depends on system prompt.
4. Thinking Experience (Feature 5) — piggybacks on existing stream.
5. Action Plan (Feature 4) — largest surface, ships last.

---

Phase 1 Planning Complete — Awaiting Approval.