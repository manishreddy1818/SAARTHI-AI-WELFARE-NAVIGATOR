# SAARTHI Phase 3 — Production Polish & Grand Finale Readiness Blueprint

Phase 3 is refinement only. No new core features, no route renames, no page redesigns, no component replacements. Everything below layers on top of existing Phase 1 + Phase 2 surfaces and preserves the current design system, navigation, and backend contracts.

If any task below is found during implementation to require architectural change (schema migration beyond additive columns, route restructuring, replacing a shared component), work halts and the item is reported back before proceeding.

---

## Feature 1 — Complete User Experience Review

**Purpose:** Guarantee every citizen and partner journey has a clear next step; no dead-ends.

**User Experience:** At every terminal screen (empty recommendations, completed action plan, submitted report, unauthenticated state), the user sees a primary next-action CTA and a secondary escape hatch (back to dashboard).

**Business Workflow:** Trace the canonical journeys:
- Citizen: Landing → Auth → Voice/Profile → Family → Recommendations → Opportunity Unlock → Action Plan → Journey Tracker → Report → Application.
- Partner: Auth → Partner Portal → Citizen intake → Partner Decision Summary → Action.

**Technical Workflow:** Audit each existing route; produce a dead-end register (route + condition + missing CTA). Fix by adding CTAs/links inside existing components — no new routes.

**Frontend Changes:** Add "next step" CTA blocks to existing empty-state and success-state slots in already-rendered components (dashboards, recommendation lists, journey tracker end state, report preview footer). Reuse existing `Button`, `Card`, and empty-state components.

**Backend Changes:** None.

**Performance Impact:** Negligible.

**Security Considerations:** No new data surfaces.

**Testing Strategy:** Manual traversal matrix (one row per journey × auth state × empty/populated data).

**Risks:** Adding CTAs that link to routes that don't exist for a given role — mitigated by role-aware CTA rendering using existing auth context.

**Success Criteria:** Zero terminal screens without a forward or lateral CTA across all documented journeys.

---

## Feature 2 — Error Handling & Recovery

**Purpose:** Replace technical errors with recovery-oriented UI.

**User Experience:** Friendly message + cause hint + retry / alternate path (e.g., "Voice unavailable — type instead"). Never raw stack traces or HTTP codes surfaced to the user.

**Business Workflow:** Categorize failure modes: network offline, timeout, empty result, missing profile field, voice permission/failure, AI timeout, upload failure, 5xx server.

**Technical Workflow:**
- Wrap top-level route trees with an ErrorBoundary component (reuse existing one if present; otherwise add a single shared boundary — not replacing existing components).
- Standardize React Query `onError` handling via a shared error toast + inline error state helper.
- For voice: extend existing voice hook's error state to expose a typed error kind, rendered by existing voice UI.
- For AI: add timeout wrapper around existing recommendation server functions with a fallback message.

**Frontend Changes:** Refine existing empty/error slots inside components; add a shared `<RecoveryState kind="..." onRetry />` presentational component that reuses current Card/Button tokens.

**Backend Changes:** Server functions return structured `{ ok: false, code, hint }` on known failures instead of throwing raw errors; existing success paths unchanged.

**Performance Impact:** None.

**Security Considerations:** Error hints must never leak PII, SQL, or stack detail — sanitized before return.

**Testing Strategy:** Chaos matrix: offline, throttled 3G, force AI 500, revoke mic permission, upload oversized file.

**Risks:** Over-catching errors and masking real bugs — mitigated by logging original error server-side while returning sanitized shape.

**Success Criteria:** Every catalogued failure surfaces a recovery UI within 2s; zero user-visible stack traces.

---

## Feature 3 — Demo Mode

**Purpose:** One-click showcase state for judges without manual data entry.

**User Experience:** A "Demo Mode" toggle visible only when an env flag is on (or when signed in as the seeded demo account). Toggling loads a fully populated citizen + partner + family view. A subtle "Demo Data" badge appears in the header while active.

**Business Workflow:** Demo Mode uses a **pre-seeded real account** — no separate mock layer, no in-memory shim. Judge signs in as the demo citizen / demo partner; everything renders through the normal data path.

**Technical Workflow:**
- Additive-only migration: seed rows for one demo citizen user, one demo partner user, one family, 3–5 documents, 4–6 recommendations, journey progress across all stages, 2 stories, 1 generated report, 1 action plan. All rows tagged `is_demo = true` on relevant tables (nullable boolean column added where missing — additive).
- A small `DemoBadge` UI reads `profile.is_demo` and shows the badge.
- Optional "Reset Demo" server function (admin-only via `has_role`) that re-idempotently re-inserts the seed set. Not required for judging; nice-to-have.

**Frontend Changes:** DemoBadge in header, gated by `is_demo`. No other UI changes.

**Backend Changes:** One additive migration containing seed inserts + `is_demo` columns. GRANT + RLS on any new column follows existing table policies (column-level access inherits table policy).

**Performance Impact:** None (bounded fixed rows).

**Security Considerations:** Demo accounts have real credentials shared only in judging notes; RLS still enforced; `is_demo` never bypasses policy checks.

**Testing Strategy:** Sign in as demo user, verify each surface is populated; sign in as fresh user, verify no demo bleed-through.

**Risks:** Seeded rows drifting from schema changes — mitigated by keeping seed in a dedicated migration re-runnable idempotently (`ON CONFLICT DO NOTHING`).

**Success Criteria:** Judge signs in and every Phase 1 + 2 surface is populated within 5 seconds, with the Demo badge visible.

---

## Feature 4 — Accessibility & Responsiveness

**Purpose:** WCAG AA baseline and layout integrity from 360px to 1920px+ without altering design language.

**User Experience:** Same visual system; better contrast on borderline tokens, larger tap targets on icon buttons, keyboard focus rings visible, screen-reader labels on icon-only controls.

**Business Workflow:** Audit → prioritized fix list → apply.

**Technical Workflow:**
- Run automated a11y sweep against every route (headings order, alt text, aria-label on icon buttons, form label association, landmark structure).
- Responsive audit at 360 / 414 / 768 / 1024 / 1440 / 1920. Header rows containing icon + text + widget converted to the documented `grid-cols-[minmax(0,1fr)_auto]` + `min-w-0` + `shrink-0` pattern where clipping is observed.
- Replace `h-screen` with `h-dvh` on any full-viewport container.
- Icon-only shadcn `Button size="icon"` gets `aria-label` + `min-h-11 min-w-11` on primary tap surfaces.
- Confirm single `<main>` per route.

**Frontend Changes:** Class-level and aria attribute refinements only. No component replacements.

**Backend Changes:** None.

**Performance Impact:** None.

**Security Considerations:** None.

**Testing Strategy:** axe-core sweep, keyboard-only traversal of each journey, VoiceOver + NVDA spot-check on landing, auth, dashboard, recommendations, report.

**Risks:** Contrast token tweak affecting dark mode — validated per token in both themes.

**Success Criteria:** Zero critical axe findings; every interactive element reachable and operable via keyboard; no layout clipping across breakpoints.

---

## Feature 5 — Performance Optimization

**Purpose:** Snappy demo, no visible loading jank.

**User Experience:** Route transitions under 300ms perceived; recommendation panel hydrates from cache instantly when revisited.

**Technical Workflow:**
- React Query: set `staleTime` per query family (profile 60s, recommendations 30s, journey 30s, static reference data 5min). Ensure loader + `useSuspenseQuery` canonical pattern is used (no `useEffect` + fetch remaining).
- Code-split heavy routes (report preview, partner dashboard, stories) via `React.lazy` at route boundary — no route file renames.
- Memoize expensive derivations in recommendation and household summary components (already client-derived per Phase 2).
- Preload LCP image on landing via route `head().links`.
- Convert bundled hero/story images to WebP via `vite-imagetools` (build-time only).
- Batch AI calls: consolidate any per-item LLM phrasing loops into a single call where feasible; cache phrasing keyed by input hash.

**Frontend Changes:** Query options tweaks, lazy imports, memoization, image format swap.

**Backend Changes:** None functionally; optional phrasing cache table only if measurably beneficial (additive, gated).

**Performance Impact:** Target LCP < 2.5s on mid-tier laptop, TTI < 3.5s.

**Security Considerations:** Cache keys must not include PII.

**Testing Strategy:** Lighthouse before/after per route; React DevTools profiler on recommendations page.

**Risks:** Over-caching leading to stale UI — mitigated by explicit invalidation on known mutations.

**Success Criteria:** Measurable LCP, TBT, and route-transition improvements on the demo device; no regressions in existing flows.

---

## Feature 6 — Judge Experience Optimization

**Purpose:** Under-5-minute end-to-end demo path with maximum feature visibility.

**User Experience:** Landing communicates value in one viewport. Dashboard surfaces AI reasoning above the fold. Recommendation cards lead with the "why" (reasoning chip) and the estimated benefit.

**Technical Workflow:**
- Order refinements only (reorder existing cards/sections via prop or minor JSX rearrangement) so top-of-page carries the highest-impact info.
- Add small "reasoning" affordances (already emitted by rules/AI engine) into existing card headers using existing tooltip/expandable components.
- Above-the-fold density audit: each key page displays its 3 most important elements without scroll at 1440×900.
- Add subtle transitions using existing motion tokens; no new animation library.

**Frontend Changes:** Ordering, chip visibility, tooltip attachment — all within existing components.

**Backend Changes:** None.

**Performance Impact:** Positive (less scroll → faster perceived).

**Security Considerations:** None.

**Testing Strategy:** Timed 5-minute demo dry-run; judge-persona checklist per page (What is this? Why does it matter? What can I click?).

**Risks:** Reordering could break responsive stacking — validated per breakpoint.

**Success Criteria:** Full demo runs in ≤ 5 minutes covering auth → recommendations → opportunity unlock → household → journey → report.

---

## Feature 7 — Application Consistency Review

**Purpose:** Uniform terminology, tokens, spacing, and states across every surface.

**Technical Workflow:**
- Terminology glossary pass (Recommendation vs Scheme vs Benefit; Citizen vs User; Partner vs NGO) → normalize display strings only.
- Style audit: every hardcoded color / arbitrary Tailwind color replaced with semantic token (`text-foreground`, `bg-muted`, etc.).
- Badge/status audit: single `<StatusBadge kind="..." />` variant map (reuse existing badge component) applied wherever ad-hoc badges exist.
- Loading state audit: consistent skeleton pattern (existing skeleton component) across all queries.
- AI response formatting: unify markdown rendering path so partner summary, recommendation reasoning, and stories share the same renderer.

**Frontend Changes:** Text swaps, className swaps to tokens, badge/skeleton unification.

**Backend Changes:** None.

**Testing Strategy:** Grep sweep for hardcoded colors and disallowed strings; visual diff spot-check.

**Risks:** Terminology change affecting screenshots in stories — copy audited alongside.

**Success Criteria:** Zero hardcoded color classes in components; single badge/skeleton implementation used everywhere.

---

## Feature 8 — Final Quality Assurance

**Purpose:** Deterministic regression suite before Grand Finale.

**Technical Workflow:** Structured test matrix, executed manually + selective automation.

Per module, define:

| Module | Critical Tests | Edge Cases | Failure Cases | Expected | Regression |
|---|---|---|---|---|---|
| Authentication | Sign up / sign in / sign out / Google OAuth | Expired session, cross-tab sign-out | OAuth cancel, wrong password | Redirects to `/auth` when unauth; to dashboard when auth | Auth still works after every deploy |
| Citizen Portal | Load dashboard, edit profile | No profile, partial profile | Backend 500 | Renders with graceful state | Nav intact |
| Partner Portal | View intake list, open citizen, view decision summary | Empty list, unassigned | 403 for wrong role | Role-gated, no leak | Partner flows unchanged |
| Voice Interaction | Record → transcript → action | No mic, permission denied, silence | STT failure | Fallback to text input | Existing voice UI intact |
| AI Memory | Context persists across turns | Long context, reset | Provider timeout | Recovery state | Memory keys unchanged |
| Recommendations | List, filter, open detail, reasoning visible | No matches, all matched | AI down | Deterministic rules fallback | Rules engine untouched |
| Explanation Engine | Reasoning chip renders | Missing fields | AI phrasing empty | Deterministic fallback text | Existing engine unchanged |
| Action Plans | Generate, view steps, mark done | No recommendations | Generation error | Recovery state | Existing flow |
| Household Summary | Aggregate across members | 1 member, 10 members | Missing family | Empty CTA | Phase 2 preserved |
| Journey Tracker | 6 stages render, progress advances | New user (stage 0) | Data mismatch | Best-effort inference | Phase 2 preserved |
| Opportunity Unlock | Suggestions sorted by impact | Nothing to unlock | AI fail | Deterministic fallback | Phase 1 preserved |
| Reports | Generate + print preview | Long content | Print API absent | Fallback download | Client-side only |
| Navigation | Every link resolves | Deep link + refresh | 404 | Not-found boundary | Route tree intact |
| Responsive | 360→1920 | Rotation | Landscape phone | No clipping | Snapshots per breakpoint |
| Performance | LCP/TBT budgets | Cold cache | Slow 3G | Skeletons show | No regression vs baseline |
| Accessibility | axe clean, kbd path | High contrast OS setting | Reduced motion | Motion honors preference | No regressions |

**Success Criteria:** Full matrix executed and green within 24 hours before finale; regression checklist re-run after every commit in finale week.

---

## Reuse / Refinement Register

**Components reused (no changes):** Button, Card, Input, Dialog, Tooltip, Badge, Skeleton, existing voice components, existing recommendation card, existing journey tracker, existing report renderer.

**Components requiring refinement (attribute/prop-level only):** header rows using ad-hoc flex → documented responsive grid pattern; icon-only buttons → `aria-label` + tap-target sizing; ad-hoc badges → unified `StatusBadge` variants; error/empty slots → shared `RecoveryState`.

**Pages requiring review:** Landing, Auth, Citizen Dashboard, Profile, Family, Recommendations, Opportunity Unlock, Action Plan, Journey Tracker, Household Summary, Report Preview, Partner Portal, Partner Decision Summary, Stories.

**Possible regressions to watch:** query staleTime changes causing stale UI; lazy imports affecting SSR/prerender for public routes (verify no protected loader on public route); token contrast tweaks in dark mode; reordering breaking mobile stacking.

**Performance improvements:** query cache tuning, route-level code split, image format, AI batching, memoization.

**Accessibility improvements:** contrast tokens, aria-labels on icon buttons, kbd focus rings, `h-dvh`, single `<main>`, landmark structure.

---

Phase 3 Planning Complete — Awaiting Approval.