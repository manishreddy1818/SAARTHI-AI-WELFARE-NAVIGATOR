# SAARTHI — AI & Data Architecture (Discovery Phase III)

Discovery only. No code. Builds on the approved Product Blueprint and Design System. This is the final planning document before implementation.

Guiding rule: **Every AI decision must be explainable, grounded, auditable, and reversible.** The AI never fabricates schemes, never issues an eligibility verdict without a source rule, and never persists sensitive data without explicit consent.

---

## PART A — SYSTEM OVERVIEW

SAARTHI is organized around a single **AI Orchestrator** that the user never sees. The user only ever talks to "SAARTHI." The Orchestrator routes each turn through specialized agents, merges their outputs, and returns a single explainable answer.

```text
┌───────────────────────────────────────────────────────────────────┐
│                          CLIENT (Web/PWA)                          │
│   Voice Orb · Transcript · Cards · Consent prompts · A11y layer    │
└───────────────▲───────────────────────────────────▲───────────────┘
                │ audio/text                        │ streamed reply
                │                                   │
        ┌───────┴───────┐                   ┌───────┴────────┐
        │  STT service  │                   │  TTS service   │
        └───────┬───────┘                   └───────▲────────┘
                │ transcript+lang                   │ audio+captions
                ▼                                   │
┌───────────────────────────────────────────────────┴───────────────┐
│                        AI ORCHESTRATOR                             │
│  Turn state · Policy · Safety · Routing · Explanation assembly     │
└──┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬───────┘
   │      │      │      │      │      │      │      │      │
   ▼      ▼      ▼      ▼      ▼      ▼      ▼      ▼      ▼
 Conv   Profile Intent Scheme Elig.  Prior. Docs   Apply Opport.
 Agent  Agent   Agent  Intel  Reason Agent  Agent  Guide Unlock
                       Agent  Agent                Agent Agent
                              │
                              ▼
                  ┌───────────────────────┐
                  │   MEMORY AGENT (R/W)  │
                  └──────────┬────────────┘
                             ▼
   ┌─────────────────────────────────────────────────────────────┐
   │  DATA PLANE                                                 │
   │  Citizen Store · Family · Documents · Applications ·        │
   │  Conversations · Consents · Notifications                   │
   │                                                             │
   │  KNOWLEDGE PLANE                                            │
   │  Scheme Knowledge Base (versioned) · Rules Engine ·         │
   │  Vector Index · Source Registry                             │
   └─────────────────────────────────────────────────────────────┘
```

Design invariants:
- The Orchestrator is the only component that talks to agents.
- Agents are **pure functions of (Profile + Context + KB)** — no agent writes to user data directly; only the Memory Agent writes, and only with reasons attached.
- Every assistant message carries an **Explanation Envelope** (sources, confidence, trace).
- The Rules Engine is deterministic; LLMs only interpret and explain rules, never override them.

---

## PART B — THE AI ORCHESTRATOR

Responsibilities per turn:
1. **Ingest** — receive `{turn_id, user_id, input(text/audio), language, consent_snapshot}`.
2. **Normalize** — STT if needed; language detect; simple-language mode flag.
3. **Route** — call Intent Agent → decide which downstream agents run and in what order.
4. **Coordinate** — run agents (parallel where safe), enforce timeouts, retry on transient failures.
5. **Reconcile** — merge outputs into a candidate response; run Safety & Policy checks.
6. **Explain** — attach Explanation Envelope (sources, confidence, next action).
7. **Persist** — hand deltas to Memory Agent (profile updates, saved schemes, consent events).
8. **Emit** — return streamed tokens + structured UI payload (cards, chips) + optional TTS.

Policies enforced centrally:
- **No-fabrication:** every scheme mention must resolve to a `scheme_id` in the KB.
- **Consent gating:** any agent request for sensitive fields checks the live Consent record before asking the user.
- **Confidence floor:** eligibility verdicts below the floor render as *"Check with officer"* rather than *"Eligible."*
- **Language coherence:** the response language matches the last user turn unless the user switches.
- **Budget:** per-turn token/time budget; degrade gracefully to a shorter answer under pressure.

Turn state (in-memory, per conversation):

```text
TurnState {
  conversation_id, user_id, actor_id (self|volunteer_of|family_of),
  language, simple_mode, consents[],
  profile_snapshot, recent_messages[N],
  active_intents[], pending_clarifications[],
  budget { tokens, ms, tool_calls }
}
```

---

## PART C — SPECIALIZED AGENTS

Each agent is specified as: **Purpose · Inputs · Outputs · Tools · Guardrails**.

### C1. Conversation Agent
- **Purpose:** Natural dialogue, tone, clarifications, empathy.
- **Inputs:** TurnState, latest user message, suggested reply skeleton from Orchestrator.
- **Outputs:** Final natural-language reply (in user's language, at target reading level), list of `follow_up_questions[]`, `next_suggested_prompts[]`.
- **Tools:** none (pure language). Reads reply skeleton + Explanation Envelope.
- **Guardrails:** never asserts eligibility on its own — must use the reasoning already attached. Never introduces a scheme name that isn't in the payload.

### C2. Citizen Profile Agent
- **Purpose:** Extract and maintain a single, continuously updated Citizen Profile.
- **Inputs:** user turns, optional document OCR events, volunteer intake forms.
- **Outputs:** structured `ProfileDelta` — additions/updates to fields with `source`, `confidence`, `consent_required`.
- **Fields:** age, gender, state, district, block/village, occupation, income_band, education, family composition, disability status, caste category (opt-in), documents held, bank account presence, land holding, house type.
- **Guardrails:**
  - Sensitive fields (caste, disability, exact income, religion) require a matching consent record — else the field is queued as `pending_consent`.
  - Every field carries `provenance` (user_said / doc_extracted / volunteer_entered) and `last_verified_at`.
  - Never overwrites a user-confirmed value silently; produces a `conflict` event.

### C3. Intent Detection Agent
- **Purpose:** Decide what the user is trying to do this turn.
- **Intents:** `find_schemes`, `check_eligibility`, `application_help`, `document_help`, `family_welfare`, `renewal_help`, `general_q`, `human_handoff`, `switch_language`, `stop`.
- **Outputs:** ranked `intents[]` with confidence; `slots` (e.g. target person = self/family member id, scheme_id if named).
- **Guardrails:** low-confidence → orchestrator asks one clarifying question via Conversation Agent.

### C4. Scheme Intelligence Agent
- **Purpose:** Retrieve candidate schemes from the KB — never invent.
- **Inputs:** Profile snapshot, intent slots, geography, language.
- **Method:** hybrid retrieval — structured filter (state/central + applicable_states + category + beneficiary tags) + vector search over scheme descriptions + rule-tag boosting.
- **Outputs:** `candidates[] = {scheme_id, version, match_reasons[], retrieval_score}`.
- **Guardrails:** results must include `scheme_id` present in KB at the returned `version`; empty results are honest (no filler).

### C5. Eligibility Reasoning Agent
- **Purpose:** Deterministic verdict + human explanation per candidate scheme.
- **Method:** Rules Engine evaluates each scheme's rule tree against the Profile. LLM only translates results into human language. **The verdict is the rules engine's, not the LLM's.**
- **Verdicts:** `eligible`, `likely_eligible`, `need_more_info`, `not_currently_eligible`.
- **Outputs per scheme:**
  ```text
  {
    scheme_id, version,
    verdict, confidence (0–1),
    matched_rules[], failed_rules[], missing_facts[],
    explanation_short, explanation_long,
    source_refs[]  // exact URL + clause id in KB
  }
  ```
- **Guardrails:** never emits `eligible` if any `failed_rule` exists; missing facts trigger a targeted clarification, not a guess.

### C6. Benefit Prioritization Agent
- **Purpose:** Rank the eligible + likely-eligible set for the user's context.
- **Score = w1·FinancialImpact + w2·SocialImpact + w3·Urgency + w4·DeadlineProximity + w5·Confidence + w6·FamilyImpact − w7·EffortToApply.**
- **Inputs:** eligibility outputs, benefit amounts, deadlines, family size, ease-of-claim tag.
- **Outputs:** ordered `recommendations[]` with per-item score components (for transparency chip).
- **Guardrails:** weights are configurable per persona (senior/farmer/etc) and per volunteer campaign; changes are logged.

### C7. Document Intelligence Agent
- **Purpose:** Reason about the citizen's document set.
- **Inputs:** documents on file (with expiry + type), documents required by target schemes.
- **Outputs:** `{missing[], expiring_soon[], reusable_across_schemes[], suggested_next_upload}`.
- **Tools:** OCR extraction (name/DOB/ID number), expiry parser, DigiLocker connector (future).
- **Guardrails:** never asserts a document is "valid" — only "present, expiring, or missing." Human review for OCR conflicts.

### C8. Application Guidance Agent
- **Purpose:** Turn a scheme into a step-by-step application journey.
- **Outputs:** `{steps[], estimated_timeline, required_office, official_portal, next_action, offline_alternative}`.
- **Guardrails:** steps must be derived from KB's `application_process`; never invents portals. Marks "assisted mode available" when a volunteer network covers the district.

### C9. Opportunity Unlock Agent
- **Purpose:** Proactive, forward-looking recommendations.
- **Method:** simulate hypothetical profile changes ("if income certificate added", "if child turns 6", "if disability certified") and re-run eligibility to find newly unlocked schemes.
- **Outputs:** `unlocks[] = {trigger, unlocked_schemes[], estimated_gain}`.
- **Guardrails:** framed as opportunities, never as pressure; sensitive triggers respect consent.

### C10. Memory Agent
- **Purpose:** Sole writer to the data plane on the AI's behalf.
- **Writes:** ProfileDeltas (with provenance), saved schemes, conversation turns, consent events, notifications, application state transitions.
- **Reads:** anything the Orchestrator needs to hydrate TurnState.
- **Guardrails:** every write carries `{actor, source_turn_id, reason, consent_id?}`; supports undo/rollback; enforces per-role write scopes.

Agent communication pattern:

```text
Orchestrator ──▶ Intent
Intent ──▶ Orchestrator
Orchestrator ──▶ Profile (delta extract)
Orchestrator ──▶ Scheme Intelligence (retrieve)  ─┐
                                                  ├─ parallel
Orchestrator ──▶ Document Intelligence (context) ─┘
Scheme candidates ──▶ Eligibility Reasoning (per scheme, parallel)
Eligibility results ──▶ Benefit Prioritization
Prioritized list ──▶ Application Guidance (top N) + Opportunity Unlock
All outputs ──▶ Orchestrator (reconcile + Explanation Envelope)
Orchestrator ──▶ Conversation Agent (final natural reply)
Orchestrator ──▶ Memory Agent (persist deltas + turn)
Orchestrator ──▶ Client (stream reply + structured UI payload)
```

---

## PART D — KNOWLEDGE BASE

### D1. Scheme record schema

```text
Scheme {
  scheme_id: string (stable)
  version: semver
  name: { en, hi, ... }               // localized
  category: enum(pension, health, education, housing, agriculture,
                 women, disability, employment, financial_inclusion, ...)
  jurisdiction: { level: central|state, applicable_states[], applicable_districts[]? }
  description: { en, hi, ... }        // plain-language
  target_beneficiaries: tag[]         // e.g. senior_citizen, marginal_farmer
  eligibility_rules: RuleTree         // machine-evaluable (see D2)
  required_documents: DocRequirement[]
  financial_benefits: {
    kind: one_time | recurring | reimbursement | in_kind,
    amount_inr?: number|range,
    frequency?: monthly|annual|event,
    non_monetary?: string
  }
  application_process: {
    channels: [online, offline, csc, camp],
    steps: Step[],
    estimated_days: number,
    responsible_office: string
  }
  official_link: url
  deadlines: { rolling|window|event, dates? }
  source: { authority, doc_url, retrieved_at, retrieved_by }
  last_updated: datetime
  review: { reviewed_by, reviewed_at, review_status }
}
```

### D2. Rule representation (deterministic)

Rules are stored as a typed tree the Rules Engine can evaluate without an LLM.

```text
Rule =
  | Predicate { field, op(=,≠,<,≤,>,≥,in,not_in,exists), value }
  | AllOf { rules[] }
  | AnyOf { rules[] }
  | NoneOf { rules[] }
  | Requires { document_type }
  | Geo { states[]|districts[] }
  | Age { min?, max? }
  | Income { max?, band? }
```

Each leaf carries a `clause_ref` pointing to the exact paragraph in the source PDF/notification — this is what surfaces as the "Why?" citation.

### D3. Storage & retrieval

- **Structured store:** relational tables for `schemes`, `scheme_rules`, `scheme_documents`, `scheme_benefits`, `scheme_versions`.
- **Vector index:** embeddings of `name + description + beneficiary_tags` per language for hybrid search.
- **Source registry:** immutable copies of original notifications with retrieval timestamps (audit).
- **Versioning:** every change bumps `version`; old versions retained so past recommendations remain reproducible.
- **Review workflow:** proposed diffs → human reviewer → publish → cache invalidation. LLMs may draft updates but never publish.

### D4. Ingestion pipeline

```text
Government portal / gazette PDF
     │
     ▼
Scraper / uploader (with source URL + timestamp)
     │
     ▼
Extractor (LLM-assisted, structured output)  ──▶ Draft Scheme record
     │
     ▼
Human reviewer (accept / edit / reject)
     │
     ▼
Publish to KB (version++)  ──▶ Vector re-index  ──▶ Cache invalidate
```

---

## PART E — EXPLAINABLE AI

Every assistant response that includes a recommendation or verdict carries an **Explanation Envelope**:

```text
Explanation {
  why_recommended: string         // 1–2 sentence plain language
  why_eligible: bullet[]          // maps to matched profile facts
  missing_conditions: bullet[]    // maps to failed rules / missing facts
  confidence: 0–1 + label(Low/Med/High)
  required_next_action: string
  official_source: { title, url, retrieved_at, clause_ref }
  trust_note: string              // e.g. "Verdict based on rules; contact officer to confirm."
  trace_id: uuid                  // links to full agent trace for audit
}
```

UI contract: the transparency chip on every card reveals this envelope in full. No recommendation ships without a complete envelope.

---

## PART F — VOICE ARCHITECTURE

```text
Mic capture (PWA)
   │  16kHz PCM chunks
   ▼
Client VAD (voice-activity detection, barge-in)
   │
   ▼
STT service ────► transcript (partial + final) + detected_language
   │
   ▼
Orchestrator (TurnState.language ← detected; if user switched, ack in reply)
   │
   ▼
Agents run (as in Part C)
   │
   ▼
Response Composer ─► text tokens (streamed)
   │                     │
   │                     ▼
   │              Client renders live captions
   ▼
TTS service ─► audio stream (streamed sentence-by-sentence)
   │
   ▼
Client audio player (with pause/skip, barge-in cancels playback)
```

Rules:
- STT and TTS are always **streamed**, not batch — perceived latency < 800ms for first audio.
- Language detection runs on every turn; a mid-conversation switch is honored immediately and acknowledged.
- Every voice turn produces text; text is the source of truth for logs, retries, and audits.
- Captions on by default. Users can play back any assistant message.
- Voice persona is configurable (Profile screen): gender, pace, honorific style.

---

## PART G — DATA MODEL

### G1. Entities & relationships

```text
Citizen 1───* FamilyMember
Citizen 1───* Document
Citizen 1───* Application ───1 Scheme (versioned ref)
Citizen 1───* Recommendation ───1 Scheme (versioned ref)
Citizen 1───* Conversation 1───* Message
Citizen 1───* Notification
Citizen 1───* Consent
Citizen *───* WelfarePartner   (via AssistedRelationship)
Scheme 1───* SchemeRule
Scheme 1───* SchemeDocumentReq
Scheme 1───* SchemeBenefit
WelfarePartner 1───* ImpactMetric
```

### G2. Key fields (contract only, no SQL)

**Citizen** — id, phone, email?, name, language, accessibility_prefs, created_at, roles[].
**FamilyMember** — id, primary_citizen_id, relationship, name, dob, gender, own_profile_ref?.
**Document** — id, owner_id (citizen or family member), type, file_ref (encrypted), extracted_fields, issued_on?, expires_on?, verified_status, uploaded_by, created_at.
**Application** — id, citizen_id, scheme_id, scheme_version, status(started|documents_needed|submitted|approved|rejected|closed), current_step, timeline_events[], assisted_by_partner_id?, next_action, updated_at.
**Scheme** — see Part D.
**Recommendation** — id, citizen_id, scheme_id, scheme_version, verdict, confidence, priority_score, explanation_envelope, generated_at, dismissed_at?.
**Conversation** — id, citizen_id, actor_id, started_at, language, channel(web|whatsapp|ivr).
**Message** — id, conversation_id, role(user|assistant|system|tool), content, audio_ref?, tokens_in/out, agent_trace_id, created_at.
**Notification** — id, citizen_id, kind(renewal|new_match|doc_expiring|application_update), channel, payload, sent_at, read_at.
**Consent** — id, citizen_id, scope(caste|disability|income|share_with_partner|voice_recording_retention|analytics), state(granted|revoked), granted_at, revoked_at?, evidence(turn_id/screen).
**WelfarePartner** — id, org_name, type(NGO|CSR|SHG|Govt), state, verified, staff_users[].
**AssistedRelationship** — partner_id, citizen_id, consent_id, scope, created_at, ended_at?.
**ImpactMetric** — partner_id, period, citizens_assisted, applications, ₹_unlocked, approval_rate, family_coverage_pct.

### G3. Provenance & audit

Every mutable row carries `created_by`, `updated_by`, `source_turn_id?`, `reason?`. Sensitive fields log a read audit (who accessed, when, why).

---

## PART H — PRIVACY & CONSENT

- **Layered consent:** base consent to use SAARTHI + per-scope consents (caste, disability, income, share-with-partner, voice retention, analytics).
- **Just-in-time prompts:** first time an agent needs a sensitive field, the user sees *"Why we ask · How we use it · You can skip."* The answer is stored as a Consent record with `evidence`.
- **Revocation is symmetric:** revoking a consent removes the associated fields from active reasoning immediately and schedules deletion per retention policy.
- **User rights (all self-serve in Profile → Data & Consent):** view all stored data, export (JSON + human PDF), delete account, delete a single field, delete a conversation.
- **Voice retention:** default = transcript kept, audio auto-deleted after 24h; users can opt into longer retention (with consent).
- **Data minimization:** agents request only fields they need for the active intent; the Orchestrator strips unneeded fields from prompts.
- **PII in logs:** redacted at write-time; only `trace_id` links a turn to its raw content in a separately-permissioned store.

---

## PART I — SECURITY & ROLES

Roles (stored in a dedicated `user_roles` table, never on the profile):
- **Citizen** — owns own data; can invite family members.
- **Family Manager** — a Citizen with an accepted `AssistedRelationship` for household members; scoped to those members.
- **Village Volunteer** — can run assisted intake for citizens who granted consent; sees only those citizens.
- **Welfare Partner Staff** — scoped to their organization's citizens + campaigns.
- **Partner Admin** — manages staff and campaigns within org.
- **Government Officer** — read-only aggregate/analytic access; no PII beyond what officer-role policy allows.
- **SAARTHI Administrator** — platform ops; no default read on citizen PII (break-glass with dual approval + audit).

Enforcement:
- Row-level access policies at the data layer, keyed off role membership + explicit relationship (partner ↔ citizen via consented `AssistedRelationship`).
- Sensitive-field access checked additionally against the citizen's active consents.
- All admin/officer PII access is logged and shown to the citizen in their audit log.
- No client-side role checks for authorization — client uses roles only for UX gating.

---

## PART J — SCALABILITY

- **Multi-tenant KB:** scheme corpus is partitioned by jurisdiction; a citizen's queries filter to `central ∪ state`. Adding a state = ingest state schemes + tag; no core change.
- **Multilingual by design:** all user-visible strings + KB descriptions store per-language; response generation localizes on demand.
- **Channels:** the Orchestrator is channel-agnostic. Adapters for Web/PWA, WhatsApp Business, IVR, and CSC kiosk share one core.
- **Government integrations:** pluggable connectors (DigiLocker, Aadhaar eKYC, UMANG, state portals). Absence of an API degrades to guided-offline flow, not failure.
- **Offline-first field ops:** volunteer/kiosk apps queue intakes locally; sync on connectivity; conflict resolution uses provenance + timestamps.
- **Model portability:** all model calls flow through a provider gateway; models are named per-role (chat, extraction, embeddings, STT, TTS) and swappable without touching agent logic.
- **Horizontal scale:** Orchestrator is stateless per turn; TurnState is rehydrated from stores; agent calls parallelized where safe.
- **Caching:** scheme retrievals + rule evaluations cached per `(profile_hash, jurisdiction, kb_version)` for repeat queries.

---

## PART K — GOVERNANCE PRINCIPLES

1. **No silent verdicts** — every eligibility outcome shows its rule trace.
2. **Rules over LLMs** — deterministic engine owns verdicts; LLMs own language.
3. **Sourced or silent** — no scheme mentioned without a KB `scheme_id + version`.
4. **Consent is a record, not a checkbox** — every sensitive read/write ties to a stored Consent.
5. **Reproducibility** — a past recommendation can be replayed against its `kb_version + profile_snapshot` and produce the same result.
6. **Human-in-the-loop** — KB updates and any auto-generated scheme content are human-reviewed before publish.
7. **Dignity in error** — the system never says "you are ineligible" as the final word; it always offers what the user *does* qualify for + who to talk to.
8. **Auditability** — trace_id on every message; retention policies documented and enforced.
9. **Right to be forgotten** — delete flows are complete, cascaded, and verifiable.
10. **Fairness** — prioritization weights are auditable and reviewable per persona/state; bias reviews are quarterly.

---

## PART L — SUCCESS METRICS (measurable)

- **Matching Accuracy** — % of AI-eligible verdicts confirmed by officer/outcome. Target: ≥ 92%.
- **Grounding Rate** — % of scheme mentions with valid `scheme_id + version + source`. Target: 100% (enforced).
- **Hallucination Rate** — mentions that fail grounding check. Target: 0 (blocked at Orchestrator).
- **Conversation Completion Rate** — % of sessions reaching at least one recommendation. Target: ≥ 75%.
- **Voice Usage** — % of turns via voice. Target: ≥ 60% among mobile users.
- **Language Distribution** — active languages served / total supported. Watch for underserved languages.
- **Application Completion Rate** — started → submitted. Target: ≥ 40%.
- **Approval Rate** — submitted → approved. Baseline set post-launch per scheme.
- **Benefits Unlocked (₹)** — per citizen, per partner, per state (headline outcome).
- **Time-to-First-Recommendation** — target ≤ 90 seconds from first turn.
- **Citizen Satisfaction (CSAT)** — post-conversation micro-survey. Target: ≥ 4.5/5.
- **Partner Productivity** — citizens screened per volunteer-hour vs. manual baseline. Target: ≥ 5×.
- **Consent Health** — % of sensitive-field reads with active consent. Target: 100%.
- **Explanation Coverage** — % of recommendations with complete Explanation Envelope. Target: 100%.

---

## PART M — RISKS & MITIGATIONS

| Risk | Mitigation |
|---|---|
| LLM invents a scheme | Grounding check at Orchestrator blocks non-KB `scheme_id`s |
| Rule interpretation drift | Deterministic Rules Engine; LLM only paraphrases |
| Sensitive data over-collection | Consent gating + data minimization in prompts |
| Language quality regressions | Golden-set evaluations per language per release |
| Model outage | Provider gateway with fallback model per role |
| KB staleness | Ingestion pipeline + review SLAs + freshness badge on cards |
| Partner over-reach | Scope-bound `AssistedRelationship`s + audit surfaced to citizen |
| Voice misrecognition of names/villages | Bias STT with location + user's known entities; confirm before writing |
| Offline sync conflicts | Provenance + timestamp resolution; volunteer prompted for conflicts |

---

## PART N — DELIVERY CHECKLIST (for build phase)

Before implementation begins, we will need concrete decisions on:
1. Managed vs self-hosted STT/TTS + language coverage list.
2. Provider gateway model choices per role (chat, extract, embed, STT, TTS).
3. KB seed set: which 50–100 schemes ship at MVP, per pilot state.
4. Consent copy per sensitive scope (legal + plain-language).
5. Retention windows per data class (audio, transcripts, docs, PII).
6. Reviewer workflow tooling for KB updates.
7. Golden evaluation set per language + per persona.

---

## Next Step

Approve this AI & Data Architecture. On approval, we exit discovery and move to **Phase 1 build**: scaffolding the design system tokens, route shell, and the Orchestrator + Rules Engine contracts (still no user-facing UI on day one — foundations first). Each build phase will be scoped and confirmed with you before code lands.
