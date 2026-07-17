# SAARTHI Phase 2 — Welfare Journey Platform Blueprint

Scope: planning only. No code, no files, no migrations. Phase 2 is strictly additive on top of the approved Phase 1 (Memory, Personality, Explanation Envelope, Action Plan, Thinking Experience). Every feature reuses Phase 1 outputs and existing tables wherever possible.

Ground rules:
- Zero regression to auth, voice I/O, citizen dashboard, partner portal, family mode, benefits, opportunity unlock, stories, rules engine, recommendation flow, design system, responsive layout, navigation, and every Phase 1 surface.
- No route renames. No page redesigns. New surfaces are added as sub-sections inside existing routes.
- Prefer deterministic derivation over new LLM calls. Avoid new tables unless unavoidable.
- Any feature that would require a major architectural change is flagged inline, not silently done.

---

## Feature 1 — Household Welfare Summary

**Purpose**
Give the family one combined view of their welfare position so they see the total value and blockers in one glance.

**User Experience**
A new summary strip at the top of the existing `/_authenticated/benefits` page (the current per-scheme grid stays below, untouched). Contents:
- Total Eligible Schemes (household, deduped by scheme_id)
- Estimated Annual Benefits (₹/year)
- Family Members Covered (e.g., "4 of 5")
- Missing Documents (aggregated chips per member)
- Highest Priority Scheme (single compact Phase 1 envelope card)
- Household Welfare Readiness % (0–100)

**Business Workflow**
- On page load, existing `getRecommendations` + `listFamily` + `listDocuments` queries are already fetched. Composition happens client-side (or in one thin server fn) with zero extra network cost.
- Any change to family_members, profile, or documents invalidates React Query keys `['recommendations','family','documents']` → summary re-derives automatically.

**AI Workflow**
None. Pure aggregation from Phase 1 envelopes. No new model call.

**Backend Changes**
- New pure helper `computeHouseholdSummary(recs, family, documents, profile)` in `rules-engine.ts` (deterministic).
- Optional thin server fn `getHouseholdSummary()` that composes the three existing server fns in one round trip. Skippable if the client already has all three cached — decide by measuring.

**Frontend Changes**
- New `<HouseholdSummaryCard>` rendered above the existing grid on `benefits.tsx`. Grid untouched.
- Existing `AiSummaryCard` remains in place for the self-scope narrative.

**Database Impact**
None.

**API Impact**
- MCP `list_recommendations` gains optional `scope: "self" | "household"` param that returns the same shape plus a `household_summary` block.

**Security Considerations**
- Only touches rows the caller already owns (profile, own family_members, own documents). No new surface.

**Performance Considerations**
- O(schemes × members) is already the recommendation cost; summary is O(recs) on top. Target <5ms client-side.
- Memoize by hash of (recommendations version, family length, documents length).

**Potential Risks**
- Benefit double-count when a scheme applies to multiple members → dedupe by `scheme_id` before summing; label the total as "estimated, one claim per scheme".
- Family_members count vs `profiles.household_size` mismatch → prefer explicit family_members; show a soft hint if they diverge.

**Success Criteria**
- Summary refreshes within one refetch after any family/document/profile edit.
- Total = sum over unique scheme envelopes in the grid, verifiable on-screen.

**Reused components**
`SchemeCard`, `AiSummaryCard`, benefits page shell, `rules-engine.ts`, existing `getRecommendations` / `listFamily` / `listDocuments`.

**Newly required**
`<HouseholdSummaryCard>`, `computeHouseholdSummary()`, optional `getHouseholdSummary()`.

**Phase 1 outputs reused**
Explanation Envelope (`estimated_benefit`, `missing_documents`, `confidence`).

**How it avoids regressions**
Purely additive DOM above the existing grid; no existing component's props or behavior change.

---

## Feature 2 — Smart Opportunity Unlock

**Purpose**
Turn the existing Opportunity Unlock into a prioritized "one action, many benefits" list showing the highest-leverage next step.

**User Experience**
The existing Opportunity Unlock component (unchanged route) gets richer rows:
- Missing Requirement (e.g., "Income Certificate", "Category: SC/ST/OBC")
- Schemes that unlock (badges, top 3 + "+N more")
- Estimated Additional Benefits (₹/year)
- Priority (High / Medium / Low)
- One-click CTA — deep link to the exact profile field or documents page

Old row shape kept as a fallback for anything the new pipeline can't classify.

**Business Workflow**
Deterministic "what-if" pass:
1. Enumerate gaps and missing_documents from every Phase 1 recommendation.
2. For each candidate gap, run a hypothetical `recommend()` with that gap filled and diff eligible set.
3. Rank by `(newly_unlocked_benefit_sum × avg_confidence_lift) / effort_weight`, where `effort_weight` is a small static table (upload = 1, verify = 3, visit office = 5).
4. Cap simulation to the top 8 most-frequent gaps to keep it O(recs).

**AI Workflow**
None required. Optional single Phase 1 personality LLM pass to phrase the top opportunity as one sentence — feature works without it.

**Backend Changes**
- New helper `simulateFactFill(facts, key, value)` and `computeOpportunities(recs, profile, family, documents)` in `rules-engine.ts`.
- Optional server fn `getOpportunities()` if we want it cached server-side; otherwise client-side over cached data.

**Frontend Changes**
- Existing Opportunity Unlock UI rendered with a richer row template. Route, container, and layout unchanged.

**Database Impact**
None.

**API Impact**
- MCP: new `list_opportunities` tool exposing the same DTO.

**Security Considerations**
- What-if simulation reads only owner data; no writes.

**Performance Considerations**
- Cap gap candidates at 8; run diffs in-memory. Expected <20ms for typical citizen data.
- Cache by (recommendations hash, profile hash).

**Potential Risks**
- Combinatorial cost with many gaps → hard cap (above).
- Soft-signal facts (e.g., SECC) → mark unlocks as "likely, verify" rather than guaranteed.
- Misleading ₹ totals if a scheme applies to multiple members → dedupe by scheme_id inside each unlock.

**Success Criteria**
- After filling any suggested gap, the previously-listed unlocks appear as eligible in Phase 1 recommendations (round-trip verified).
- Top opportunity's ₹ value is a non-decreasing function of the number of unlocked schemes.

**Reused components**
Existing Opportunity Unlock UI, `rules-engine.ts`, Phase 1 envelope, documents/profile page CTAs.

**Newly required**
`simulateFactFill()`, `computeOpportunities()`, priority badge, richer row template.

**Phase 1 outputs reused**
Envelope's `missing_criteria`, `missing_documents`, `estimated_benefit`, `confidence`.

**How it avoids regressions**
Same route and container; only the row template is enriched. Fallback path preserves current rendering when data is insufficient.

---

## Feature 3 — Partner Decision Dashboard

**Purpose**
Give a welfare partner a scannable operational summary per citizen so a volunteer can decide next action in under 30 seconds.

**User Experience**
On the existing `partner.citizens.$id.tsx` page, add a top summary block (existing intake/detail sections stay below and unchanged):
- Citizen Overview (name, age, state, occupation, household size)
- Priority Level (High / Medium / Low)
- Eligible Schemes (count + top 3 chips)
- Missing Documents (aggregated)
- Risk Indicators (e.g., disability + no pension, widow + no widow-pension, income < ₹5k + no ration card, minor + out of school)
- Recommended Next Step (single sentence)
- Follow-up Priority (7 / 30 / 90 days)
- Estimated Benefit Coverage % (benefits available vs benefits already applied)

**Business Workflow**
Deterministic:
- Static `RISK_FLAGS` rule table applied to the citizen row + `partner_citizen_family`.
- Priority Level derived from `(number_of_high_risk_flags, sum(estimated_benefit), missing_documents_count)` with fixed thresholds.
- Follow-up Priority derived from priority × application status ages.

**AI Workflow**
Optional Phase 1 personality pass (partner-mode tone, formal) to phrase the Recommended Next Step sentence. Guardrail: the LLM only rewords facts already present in the deterministic DTO; any invented field is dropped by a whitelist check.

**Backend Changes**
- New server fn `getPartnerCitizenSummary(citizenId)` guarded by `requireSupabaseAuth` + role check via `has_role(auth.uid(), 'partner')`.
- Static `RISK_FLAGS` table alongside `rules-engine.ts`.

**Frontend Changes**
- New `<PartnerCitizenSummaryCard>` at the top of the citizen detail page. Existing sections unchanged.

**Database Impact**
None required. All fields derivable from existing `partner_citizens` + `partner_citizen_family` + `schemes` + `applications`.

**API Impact**
- New authenticated server fn only. No public endpoint.

**Security Considerations**
- Partner role verified before returning anything.
- RLS on `partner_citizens` already scopes to the owning partner; new fn adds no bypass.

**Performance Considerations**
- Reuses cached recommendations for the citizen; one extra pass over rules table. Target <300ms warm.

**Potential Risks**
- LLM introducing invented flags → deterministic flags only render; LLM text is descriptive.
- Priority misclassification → thresholds are documented and adjustable in one place.

**Success Criteria**
- Card renders in <1s on warm cache for a citizen with ≤10 family members.
- Every displayed flag is reproducible from `RISK_FLAGS` (no black-box outputs).

**Reused components**
Partner portal shell, existing citizen detail page, `rules-engine.ts`, Phase 1 personality prompt (partner variant).

**Newly required**
`<PartnerCitizenSummaryCard>`, `RISK_FLAGS`, `getPartnerCitizenSummary()`.

**Phase 1 outputs reused**
Envelope + optional personality text.

**How it avoids regressions**
Additive card only; existing partner routes, forms, and lists are unaffected.

---

## Feature 4 — Printable Welfare Report

**Purpose**
Produce a printable one-document snapshot the citizen (or partner) can take to a MeeSeva / CSC counter.

**User Experience**
- "Download / Print Welfare Report" button on:
  - Citizen: benefits page and profile page.
  - Partner: `partner.citizens.$id.tsx`.
- Click opens a modal with a rendered HTML preview and a "Print / Save as PDF" action.
- Sections:
  1. Citizen Profile Summary
  2. Family Summary (Feature 1 output)
  3. Eligible Schemes (Phase 1 envelopes, condensed)
  4. Explanation Summary (per scheme: 1–2 lines from envelope)
  5. Missing Documents (grouped by member)
  6. AI Action Plan (Phase 1 output for top scheme)
  7. Generated timestamp + SAARTHI footer + disclaimer

Explicitly out of scope: cloud sharing, QR codes, public links.

**Business Workflow**
- Compose the report entirely from data already available in the app: profile, family, recommendations, action plan.
- Render to a print-only HTML template with `window.print()` (browser handles PDF output).

**AI Workflow**
None required. Optional Phase 1 personality pass for a 2-sentence executive summary — feature works without it.

**Backend Changes**
- Optional server fn `buildWelfareReport()` returning a structured `ReportModel` for reproducibility. If all fields are already cached client-side, this can be pure client composition.

**Frontend Changes**
- New `<WelfareReportModal>` with an HTML template that matches design tokens.
- New print stylesheet scoped to `.print-report` in `src/styles.css` (page-break rules, hide chrome). No impact on normal pages.

**Database Impact**
None.

**API Impact**
None.

**Security Considerations**
- Report never leaves the browser; no share links, no server storage.
- Partner variant is gated by the existing partner role check.

**Performance Considerations**
- Preview renders from cached data in <500ms.
- Uses the browser's native print engine — no Worker-side PDF library, avoids Cloudflare Workers runtime constraints.

**Potential Risks**
- Print layout drift across browsers → verify Chrome + Firefox + Safari with A4 defaults; provide a "1 page" and "multi-page" mode.
- Long family lists overflowing → set `page-break-inside: avoid` per section.

**Success Criteria**
- Report prints cleanly on A4 with all sections readable; sample verified via `pdftoppm` inspection during dev.
- Zero PII leaves the browser.

**Reused components**
Phase 1 envelopes, Feature 1 household summary, Phase 1 action plan, design tokens.

**Newly required**
`<WelfareReportModal>`, optional `buildWelfareReport()`, print stylesheet.

**Phase 1 outputs reused**
Envelope + action plan + optional personality summary.

**How it avoids regressions**
Modal is opened on demand from existing pages; print styles are namespaced and cannot affect normal rendering.

---

## Feature 5 — Application Journey Tracker

**Purpose**
Show the citizen where they are across the whole welfare journey, not just per-scheme, and nudge completion.

**User Experience**
- Persistent horizontal tracker at the top of the citizen dashboard (does not replace existing widgets).
- Stages: Profile Completed → Eligibility Checked → Documents Ready → Application Submitted → Application Processing → Benefits Received.
- Displays: Current Stage, Overall Progress %, Pending Tasks list, Estimated Remaining Steps.
- Clicking a stage scrolls to the relevant existing section.

**Business Workflow**
Deterministic derivation from data already in the app:
- Profile Completed: `profiles.updated_at` and completeness ≥ 40% (existing `profileCompleteness`).
- Eligibility Checked: `recommendations` query has returned at least one row this session, OR a persisted flag (see Database Impact below).
- Documents Ready: `documents` count ≥ required-docs count for the top-priority scheme.
- Application Submitted: `applications.status in ('submitted','under_review','approved','received')`.
- Application Processing: `applications.status = 'under_review'`.
- Benefits Received: `applications.status = 'received'` OR action-plan disbursal step marked done.

Progress % is a weighted sum of stage flags (monotonic — never regresses without a user action).

**AI Workflow**
None. Optional Phase 1 personality one-liner ("You're one step from Documents Ready — upload Aadhaar next.").

**Backend Changes**
- New server fn `getJourneyStatus()` composing existing tables into stage flags. No new tables required — Eligibility Checked can be inferred from "has recommendations for this profile hash" cached in memory or in `profiles.last_eligibility_checked_at` if we want durability (single optional nullable column, no new table).

**Frontend Changes**
- New `<JourneyTracker>` at the top of the citizen dashboard.
- Small hooks into existing flows to update the optional `last_eligibility_checked_at` timestamp when recommendations are first fetched — no UI changes to those flows.

**Database Impact**
- Prefer zero schema change. If durability of "Eligibility Checked" across sessions is required, add a single nullable column `profiles.last_eligibility_checked_at timestamptz` with existing RLS (no new table). GRANT block already covers `profiles`.

**API Impact**
- MCP: `get_journey_status` tool for agent use (optional, low priority).

**Security Considerations**
- All derivations use the caller's own rows under existing RLS. No new attack surface.

**Performance Considerations**
- Journey status is O(applications + documents + recommendations) — all already fetched on the dashboard. Compose client-side to avoid extra round trips.

**Potential Risks**
- Regressing stages if a user deletes an application → treat stage regression as intentional (reflects reality).
- Phrasing feeling punitive → follow Phase 1 personality guidelines.

**Success Criteria**
- Tracker updates within one interaction after uploading a document or saving an application.
- No stage regresses without a corresponding user action (6-step scripted test).

**Reused components**
Citizen dashboard shell, existing applications/documents/recommendations queries, `profileCompleteness`.

**Newly required**
`<JourneyTracker>`, `getJourneyStatus()`, optional `profiles.last_eligibility_checked_at` column.

**Phase 1 outputs reused**
Action plan step completion (Benefits Received), envelope's `missing_documents` (Documents Ready count).

**How it avoids regressions**
Additive strip on the dashboard; existing widgets unchanged. Optional column is nullable with a default of null.

---

## Feature 6 — Where to Apply

**Purpose**
For each scheme, surface a lightweight list of "where to apply" options without a location platform.

**User Experience**
On the existing scheme detail page (`schemes.$id.tsx`), add a small section:
- Official Portal (with URL)
- MeeSeva
- CSC
- Government Office (department name)
- Purpose / Supported Services
- Official Website

Static, deterministic, no maps, no distance.

**Business Workflow**
- The mapping (`scheme → channels`) is a small deterministic lookup keyed off `schemes.category`, `schemes.ministry`, and `schemes.level`. A small typed constant `SCHEME_CHANNELS` in `rules-engine.ts` (or a sibling module) provides sensible defaults per category — no new table.
- Per-scheme overrides can live in an existing free-form column such as `schemes.tags` or a new nullable `schemes.channels jsonb` if we want editorial control later. Preferred: no schema change for Phase 2; add later if editorial control becomes necessary.

**AI Workflow**
None.

**Backend Changes**
- New helper `getSchemeChannels(scheme)` returning a typed list of channels.

**Frontend Changes**
- New `<SchemeChannelsList>` embedded on the scheme detail page below the existing header. No layout changes to the rest of the page.

**Database Impact**
- Preferred: none. Mapping is code-level constants.
- Optional (deferred): `schemes.channels jsonb` if editorial overrides are needed later.

**API Impact**
- MCP: optional `get_scheme_channels` tool for agent use.

**Security Considerations**
- Static reference data; no user data involved.

**Performance Considerations**
- Constant-time lookup. Zero network cost.

**Potential Risks**
- Wrong or stale channel information → include a short disclaimer and "verify locally" note.
- Categories not covered by defaults → fallback shows only Official Portal + Government Office.

**Success Criteria**
- Every scheme shows at least Official Portal + one physical channel.
- No scheme detail page slows down beyond current baseline (measure LCP unchanged).

**Reused components**
Scheme detail page shell, design tokens.

**Newly required**
`<SchemeChannelsList>`, `SCHEME_CHANNELS`, `getSchemeChannels()`.

**Phase 1 outputs reused**
Optionally linked from Phase 1 action plan steps.

**How it avoids regressions**
Additive section only; existing scheme detail rendering, buttons, and layout unchanged.

---

## Cross-cutting concerns

- **AI usage**: only Features 1, 2, 3, 4 have optional one-liner LLM passes, each degradable to deterministic output. Default cap: at most one Gemini flash call per feature per view. Feature flags per profile so we can toggle at demo time.
- **Caching**: React Query keys (`recommendations`, `family`, `documents`, `applications`, `profile`) are reused; new summaries derive client-side to avoid new round trips.
- **Migrations**: at most one small nullable column on `profiles` for Feature 5. No new tables in Phase 2.
- **Runtime**: no Node-only packages introduced. Report uses browser print — no Worker PDF library.
- **Observability**: log `{feature, ms}` for each new helper; add `{model, tokens}` only when the optional LLM path runs.
- **Backward compatibility**: every new component is additive, sits inside an existing route, and has a fallback state that reproduces the current UI when data is missing.

## Architectural changes flagged

None. Every Phase 2 feature stays within the current architecture. If later the user asks for cloud sharing / QR / server-side PDF, that must be re-scoped separately because it introduces Worker runtime constraints and public read paths.

## Rollout order (proposed)

1. Feature 1 — Household Summary (pure derivation, safest first).
2. Feature 5 — Journey Tracker (thin, high perceived value).
3. Feature 2 — Smart Opportunity Unlock (extends existing surface).
4. Feature 6 — Where to Apply (constant-time addition).
5. Feature 3 — Partner Decision Dashboard (partner scope, isolated).
6. Feature 4 — Printable Welfare Report (largest surface, ships last).

---

Phase 2 Planning Complete — Awaiting Approval.