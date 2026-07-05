# SAARTHI — MVP Implementation Contract

Final planning artifact. No code in this document. Signed against the approved Product Blueprint, Design System & Screen Inventory, and AI & Data Architecture.

Guiding rule: **A smaller product that works flawlessly beats a larger one that partially works.** Every feature listed below must ship demo-ready with real behavior, real data, and complete states. Anything that cannot meet that bar is cut into Future Scope, not shipped as a placeholder.

---

## 1. Golden Demo Path (the single flow that must be flawless)

```text
Splash  →  Landing  →  Choose Journey  →  Auth (citizen)  →  Citizen Dashboard
     ↓
Tap "Talk to SAARTHI"  →  AI Assistant (voice + text)
     ↓
AI intake conversation  →  Citizen Profile built live
     ↓
AI returns ranked Benefits Feed  →  Tap a scheme
     ↓
Scheme Details: why eligible · docs needed · steps · official source · confidence
     ↓
Opportunity Unlock card: "If you add X, 3 more schemes unlock"
     ↓
Save Recommendation  →  Appears in Dashboard + Family Dashboard
```

This end-to-end path is the acceptance test for the MVP. Everything else supports it.

---

## 2. In-Scope Feature Ledger (what we will build)

Each item ships only when it satisfies the Quality Bar in §5.

### Phase 1 — Foundations & Citizen Product
| # | Feature | Contract |
|---|---|---|
| 1.1 | Design system tokens + shell | Semantic tokens (light+dark), typography, motion primitives, VoiceOrb primitive, empty/loading/error components |
| 1.2 | Route shell (TanStack) | All routes from IA created, no dead links, bottom nav (citizen), public nav |
| 1.3 | Splash Experience | Auto-advancing sequence, skip, first-visit-only, respects reduced-motion |
| 1.4 | Landing Page | Real content for Hero · Problem · Solution · Features · How · Stories · FAQ · Footer |
| 1.5 | Choose Your Journey | 3 real routes: citizen signup, partner signup, public stories |
| 1.6 | Authentication | Email + password, Google sign-in, language + accessibility onboarding step |
| 1.7 | Citizen Dashboard | Greeting, estimated benefits, recommended actions, applications strip, family strip, recent activity, quick AI |
| 1.8 | AI Assistant | Voice + text, live captions, streaming responses, suggested prompts, transcript, Explanation Envelope surfacing |
| 1.9 | Citizen Profile Creation | Built conversationally by AI; editable in Profile screen |
| 1.10 | Benefits Feed | Ranked scheme cards with priority, benefit, verdict, confidence, actions |
| 1.11 | Scheme Details | Full Explanation Envelope UI + docs checklist + steps + save + apply |
| 1.12 | Family Dashboard | Add/edit members, per-member eligible count, member detail |
| 1.13 | Documents | Manual upload, checklist, expiry chips, linked-to-scheme badges (no OCR pipeline for MVP) |
| 1.14 | Applications | Status tracking (started/documents_needed/submitted/approved/rejected), timeline, next action |
| 1.15 | Profile | Personal info, language, accessibility, voice settings, notifications, role switch, data & consent (view/export/delete), logout |

### Phase 2 — AI Intelligence (backing Phase 1 surfaces)
| # | Component | Contract |
|---|---|---|
| 2.1 | AI Orchestrator | Server-side; per-turn state, routing, budget, policy checks, Explanation assembly |
| 2.2 | Conversation Agent | Natural replies bound to the payload; no free-form scheme mentions |
| 2.3 | Citizen Profile Agent | Extracts ProfileDeltas with provenance + consent flags |
| 2.4 | Scheme Intelligence Agent | Hybrid retrieval over seeded KB; grounded to `scheme_id + version` |
| 2.5 | Eligibility Reasoning | Deterministic Rules Engine + LLM explainer; four verdicts |
| 2.6 | Opportunity Unlock | Simulates hypothetical profile changes; returns unlocks with estimated gain |
| 2.7 | Explainable AI | Every recommendation carries a complete Explanation Envelope; enforced server-side |
| 2.8 | Memory | Sole writer to Cloud tables; every write carries actor + reason |
| 2.9 | Voice Conversation | Streaming STT + streaming TTS; barge-in; captions on by default; language switch mid-conversation |

Phase 2 note — MVP simplifications that keep the architecture intact:
- Intent Agent and Benefit Prioritization Agent are collapsed into the Orchestrator's routing + a scoring function for MVP; they can be extracted later without contract changes.
- Application Guidance is served from the KB `application_process` field directly (no separate agent runtime for MVP).
- Document Intelligence Agent is limited to "missing / expiring / reusable" reasoning over user-declared documents; OCR is out of scope.

### Phase 3 — Welfare Partner Experience (thin but real)
| # | Feature | Contract |
|---|---|---|
| 3.1 | Partner Dashboard | Real KPIs from seeded + demo-run data |
| 3.2 | Voice Intake | Volunteer speaks; live transcript + live profile extraction; save creates a real citizen record with consent |
| 3.3 | Citizen Search | Search + filter partner's scoped citizens |
| 3.4 | Citizen Management | View, edit consent-scoped fields, add follow-up |
| 3.5 | Reports | Export CSV of assisted citizens + outcomes (date-range filter) |
| 3.6 | Impact Dashboard | Citizens helped · ₹ unlocked · applications · approval rate · family coverage |

### Phase 4 — Presentation Polish
| # | Feature | Contract |
|---|---|---|
| 4.1 | Real Citizen Journeys | 5 preloaded, replayable stories (Senior, Farmer, Student, Woman Entrepreneur, Disabled Citizen). Public at `/stories`. |
| 4.2 | Beautiful Animations | Voice orb 4 states, route transitions, card hover, staggered enters — all respecting reduced-motion |
| 4.3 | AI Thinking Animation | Shimmer bar, no spinners |
| 4.4 | Accessibility | WCAG 2.2 AA baseline; keyboard-only pass; screen-reader pass on golden path |
| 4.5 | Responsive Design | Mobile-first citizen; desktop-optimized partner; both tested at 3 breakpoints |
| 4.6 | Loading / Empty / Error / Offline | On every screen; skeletons match final layout |
| 4.7 | Error Handling | Toasts + inline; AI failures degrade with retry + text fallback; billing/rate-limit errors surfaced clearly |

---

## 3. Explicitly Out of Scope (Future Scope only — do not build)

- Blockchain, cryptocurrency, tokens.
- Complex admin panels (any admin need is served by seed scripts or a minimal secured page, not a UI surface).
- Social feed, user-to-user chat, comments, likes.
- Payments / donations / subscriptions.
- OCR-heavy document workflows (users declare document possession; no auto-extract at MVP).
- Real government API integrations (DigiLocker, UMANG, Aadhaar eKYC) — mocked at KB level.
- WhatsApp bot, IVR phone line, CSC kiosk channel.
- SMS OTP / phone-number auth (email + Google only for MVP).
- Native mobile apps.
- Real-time push notifications (in-app notifications only; no push service).
- Multi-tenant partner org onboarding UI (partner accounts seeded).
- Full state-by-state KB rollout (see §6 seed set).

If a demo question surfaces any of these, the answer is *"On the roadmap; here's what SAARTHI does today."*

---

## 4. Data & Backend Scope (Lovable Cloud)

Tables shipped at MVP (mirroring the Data Model from the Architecture doc, trimmed to demo needs):
`citizens`, `family_members`, `documents` (metadata + file), `applications`, `schemes`, `scheme_rules`, `scheme_documents`, `scheme_benefits`, `recommendations`, `conversations`, `messages`, `notifications`, `consents`, `welfare_partners`, `assisted_relationships`, `user_roles`.

Rules:
- Every table has RLS. Roles stored in `user_roles` (never on profile).
- `has_role()` security-definer function used in policies.
- Sensitive fields gated by both RLS and an active `consents` row.
- Every mutable row carries `created_by`, `updated_at`, and (for AI writes) `source_turn_id + reason`.
- `service_role` grants on every public table; `authenticated` grants scoped to what the app actually needs.
- Storage bucket `documents` (private) for user document files.

AI plane:
- Chat + extraction: `google/gemini-3-flash-preview` via Lovable AI Gateway.
- Embeddings for KB retrieval: Lovable AI Gateway embeddings model.
- STT: `openai/gpt-4o-mini-transcribe` (streaming).
- TTS: `openai/gpt-4o-mini-tts` (streamed sentence-by-sentence).
- All AI calls go through server functions / server routes; `LOVABLE_API_KEY` never touches the client.

---

## 5. Quality Bar (definition of done, per screen)

A screen may ship only when ALL of the following are true:
1. Real data-bound content — no lorem ipsum, no dead cards.
2. Loading state (skeleton matching final layout).
3. Empty state (illustration + one clear next step).
4. Error state (plain-language + retry + human-help escape).
5. Success feedback for every mutating action (toast or inline).
6. Keyboard-operable end-to-end; visible focus rings.
7. Screen-reader pass: landmarks, labels, alt text.
8. Mobile + desktop layouts verified at defined breakpoints.
9. Dark mode parity.
10. Every visible button/link is wired to a real destination or action.

A recommendation may ship only when ALL of the following are true:
1. Grounded — resolves to a real `scheme_id + version` in the KB.
2. `why_recommended` present.
3. `why_eligible` bullets present (mapped to profile facts).
4. `missing_conditions` present when verdict ≠ eligible.
5. `confidence` value + label present.
6. `required_documents` list present.
7. `next_step` present.
8. `official_source` link with `retrieved_at` present.
9. `trust_note` present.

The Orchestrator refuses to emit a recommendation missing any of the above.

---

## 6. Scheme Knowledge Base Seed (MVP)

- **25–30 real Indian welfare schemes** covering the 5 demo personas end-to-end, sourced from official portals with URL + retrieval timestamp.
- Coverage mix: central (PM-KISAN, PMAY-G, Ayushman Bharat, NSAP pensions, PMJDY, PMJJBY, PMSBY, Sukanya Samriddhi, Stand-Up India, etc.) + state-level examples from 2 pilot states.
- Categories: pension, health, housing, agriculture, women, disability, education, financial inclusion, employment.
- Every seeded scheme includes: rule tree, required documents, benefit amount, application steps, official link, source citation.
- Ingestion: manual for MVP (no auto-scraper); recorded as a seed migration + reviewer sign-off.

---

## 7. Voice Contract (MVP)

- Push-to-talk button on the AI Assistant; always-available floating voice orb on citizen screens.
- Streaming STT with partial + final transcripts; first-token TTS latency target ≤ 1.2s (best-effort).
- Barge-in cancels TTS playback.
- Captions on by default; every voice turn produces text that persists.
- Languages shipped: **English + Hindi** at MVP, with the language switcher UI in place and the pipeline ready to accept more. Adding a language post-MVP is data + prompt work, not architecture work.
- Voice retention: transcript kept; raw audio discarded within 24h unless user opts in.

---

## 8. Consent & Privacy (MVP)

- Layered consents implemented: base app consent + per-scope (caste, disability, income, share-with-partner, voice retention).
- Just-in-time prompts before any sensitive extraction; skippable; recorded with `evidence(turn_id)`.
- Profile → Data & Consent screen supports **view all data**, **export as JSON**, **delete a single field**, **delete a conversation**, **delete account**.
- Revocation removes the field from active reasoning immediately.

---

## 9. Role & Access (MVP)

Roles enabled: `citizen`, `family_manager` (implicit via relationship), `partner_staff`, `partner_admin`. Officer + platform_admin scaffolded in `user_roles` enum but no UI surface at MVP.

Enforcement:
- RLS policies keyed on `has_role()` + `assisted_relationships`.
- Client uses role only for UX gating — never for authorization.

---

## 10. Non-Goals & Trade-offs (things we intentionally accept at MVP)

- Recommendations recompute on demand; no background job runs.
- Notifications are in-app only (no email/SMS/push).
- Partner org onboarding is seed-only; no self-serve org creation UI.
- Officer analytics console is deferred.
- Only 2 pilot states in KB; national coverage is roadmap.
- OCR, DigiLocker, and government API submission all replaced by "Apply on official portal" outbound link.
- Analytics is limited to internal event logging; no BI dashboard beyond partner Impact.

---

## 11. Build Sequence (proposed phases — each ends with a working slice)

Each phase is confirmed with you before code lands. No phase leaves a broken UI behind.

1. **Foundations** — design tokens, route shell, auth, empty citizen dashboard, public marketing routes, splash. *Deliverable:* click through every route, no dead ends.
2. **Data + KB** — Cloud schema + RLS + seed of 25–30 schemes with rules. *Deliverable:* schemes queryable; rule engine unit-testable via seeded profiles.
3. **AI Orchestrator (text-only)** — server-side orchestrator, Conversation + Profile + Scheme Intelligence + Eligibility agents, Explanation Envelope. AI Assistant screen runs on text. *Deliverable:* golden path works in text mode end-to-end.
4. **Benefits, Scheme Details, Save flow** — Benefits Feed, Scheme Details with full envelope, save-to-dashboard. *Deliverable:* citizen can go conversation → save.
5. **Family, Documents, Applications** — CRUD + status tracking + doc-linked schemes. *Deliverable:* full citizen product working.
6. **Voice** — streaming STT + TTS, voice orb states, captions, language switch. *Deliverable:* golden path runs voice-first.
7. **Opportunity Unlock + Memory polish** — proactive unlocks, recent activity, notifications. *Deliverable:* dashboard feels alive.
8. **Partner surface** — dashboard, voice intake, citizen list, reports, impact. *Deliverable:* partner golden path works.
9. **Stories + Polish** — 5 replayable journeys, motion, empty/error illustrations, a11y pass, responsive pass. *Deliverable:* demo-ready.
10. **Hardening** — perf, error resilience, offline banner, final accessibility audit, seed data cleanup, demo script rehearsal.

At any point, if a phase's Quality Bar isn't met, we stop and fix before moving on.

---

## 12. Acceptance Tests (must all pass before we call MVP done)

1. **Golden Path (voice)** — from `/` to a saved recommendation, spoken end-to-end, in under 3 minutes.
2. **Golden Path (text)** — same as above with keyboard only, no mouse, no voice.
3. **Screen-reader traversal** — VoiceOver / TalkBack completes the golden path with meaningful announcements.
4. **Explanation coverage** — every recommendation surfaced in the app opens a complete Explanation Envelope.
5. **Grounding audit** — no assistant message references a scheme name not present in the KB (script-checked against a seeded conversation set).
6. **Consent audit** — no sensitive field is written without a matching consent row.
7. **Role isolation** — partner_staff cannot read a non-assisted citizen; citizen cannot read another citizen; verified via automated policy tests.
8. **Reduced motion** — all animations degrade to static or subtle fades under `prefers-reduced-motion`.
9. **Dark mode parity** — golden path in dark mode has no contrast failures.
10. **Offline behavior** — with network off, cached dashboard reads, and clear offline banner + retry.

---

## 13. Risks & Mitigations (MVP-specific)

| Risk | Mitigation |
|---|---|
| Voice latency undercuts wow-factor | Ship text-first in Phase 3, layer voice in Phase 6; degrade gracefully to text on failure |
| KB seed too shallow to feel real | Anchor seed around 5 demo personas so every persona has ≥ 5 real eligible schemes |
| LLM hallucination | Grounding check at Orchestrator; deterministic rules engine owns verdicts |
| Scope creep from live demo feedback | This contract is the source of truth; changes require an explicit contract update |
| Partner surface eating citizen polish time | Partner is Phase 8; if time-boxed, we ship citizen + stories + voice and defer partner Impact export |
| STT quality on Hinglish | Ship English + Hindi at MVP; add languages post-MVP with dedicated golden sets |

---

## 14. What "Done" Looks Like

- The Golden Demo Path completes without a single failure, in voice and in text, on mobile and on desktop, in light and dark mode, with keyboard and with screen-reader.
- Every screen listed in Phase 1 + Phase 3 meets the Quality Bar.
- Every recommendation meets the Recommendation Bar.
- 5 Citizen Stories are live and replayable.
- Partner can run a Voice Intake and export a report.
- No dead links, no fake buttons, no lorem ipsum, no broken states.

---

## Next Step

Approve this contract. On approval, we begin **Phase 1 (Foundations)** — design tokens, route shell, auth, empty citizen dashboard, public marketing routes, and splash — and confirm the working slice with you before moving to Phase 2.
