# SAARTHI — Product Blueprint (Discovery Phase)

No code will be written in this phase. This blueprint is the single source of truth that every future design, engineering, and AI decision must reference.

---

## 1. Product Vision

SAARTHI is an **AI Welfare Navigator** — a conversational, multilingual, voice-first assistant that ensures no eligible citizen in India misses a government benefit because of awareness gaps, language barriers, digital illiteracy, or bureaucratic complexity.

It behaves less like a portal and more like a **trusted welfare officer sitting next to the user**, who listens, understands the family's situation, and quietly does the hard work of matching them to schemes, explaining eligibility in plain language, and guiding them through applications end-to-end.

North-star sentence: *"Tell SAARTHI about your family once, and never miss a benefit you deserve again."*

---

## 2. Problem Statement

- India runs 950+ central and state welfare schemes; the average citizen knows fewer than 5.
- Discovery is fragmented across dozens of portals, PDFs, and regional-language notifications.
- Eligibility rules are legalistic, conditional, and change frequently.
- Elderly, rural, and low-literacy users cannot navigate form-heavy government UIs.
- NGOs and village volunteers do this matching manually, at massive time cost.
- Officers lack tooling to proactively surface benefits to their constituents.

Consequence: crores of rupees in entitlements go unclaimed every year by the people who need them most.

---

## 3. Target Users (Primary → Secondary)

1. **Citizens** — individual beneficiaries, often mobile-first, often low-literacy.
2. **Families** — one digitally-capable member managing benefits for parents, children, siblings.
3. **NGOs** — field workers running welfare drives, need bulk screening.
4. **Welfare Partners** — CSR arms, cooperatives, SHGs distributing entitlements.
5. **Village Volunteers / ASHA / Anganwadi workers** — trusted intermediaries.
6. **Government Welfare Officers** — BDOs, district officers monitoring uptake.

---

## 4. User Personas

**Persona 1 — Ramesh, 62, retired farmer, Bihar**
Speaks Bhojpuri/Hindi, WhatsApp-literate, cannot fill forms. Wants pension, ration, health cover. Needs voice, big text, no jargon.

**Persona 2 — Priya, 29, daughter in Bengaluru managing parents in Jaipur**
English/Hindi, high digital literacy. Wants a family dashboard, reminders, document vault, application tracking on behalf of parents.

**Persona 3 — Anjali, 34, NGO field coordinator, Odisha**
Screens 40 families/week. Needs a "batch intake" mode, exportable eligibility reports, offline-tolerant flows.

**Persona 4 — Suresh, 45, Village Volunteer (Panchayat)**
Trusted by neighbours. Needs a lightweight assisted mode where he speaks on a citizen's behalf and prints/shares a benefits summary.

**Persona 5 — Ms. Kavita, District Welfare Officer**
Needs an aggregate view: coverage gaps, top unclaimed schemes in her block, ability to push targeted outreach.

---

## 5. Complete User Journey (Citizen — primary flow)

```text
Landing
   │  "Namaste. Main SAARTHI hoon. Aap kis bhasha mein baat karenge?"
   ▼
Language + Voice/Text choice
   ▼
Conversational Intake (not a form)
   • Age, gender, state, district
   • Occupation, income band
   • Family composition
   • Disability / health / caste category (opt-in, explained why)
   • Documents already available (Aadhaar, ration card, etc.)
   ▼
AI Reasoning (invisible to user)
   • Match against scheme knowledge base
   • Rank by (eligibility confidence × benefit value × ease of claim)
   ▼
Personalized Benefits Feed
   • "You likely qualify for 7 schemes worth ~₹48,000/year"
   • Each card: plain-language what/why/how-much/next-step
   ▼
Deep-dive on a scheme
   • Eligibility explained conversationally
   • Documents checklist
   • "Apply with SAARTHI" — guided step-by-step
   • "Talk to a volunteer" — human handoff
   ▼
Application Companion
   • Document vault, prefilled data, status tracking, reminders
   ▼
Post-claim
   • Renewal alerts, new-scheme alerts, family re-screening
```

Parallel journeys for **Family Manager**, **NGO Batch Intake**, **Volunteer Assisted Mode**, and **Officer Dashboard** branch from the same intake engine.

---

## 6. Information Architecture

Top-level spaces (not necessarily nav items — some are contextual):

- **Home / Conversation** — the primary surface; always one tap away.
- **My Benefits** — personalized feed, categorized (Active, Eligible, In Progress, Renewals).
- **Scheme Library** — browsable, searchable, filterable (fallback discovery).
- **Family** — profiles for household members, per-person benefits view.
- **Documents** — secure vault, reusable across applications.
- **Applications** — tracker with statuses, next actions, reminders.
- **Help & Human Support** — volunteer chat, NGO connect, call-back request.
- **Profile & Language** — preferences, accessibility, consent controls.

Role-scoped spaces:
- **NGO Workspace** — beneficiaries, campaigns, exports.
- **Volunteer Mode** — assisted intake, print/share summary.
- **Officer Console** — coverage analytics, outreach.

---

## 7. Feature Hierarchy

**Tier 0 — Non-negotiable (MVP)**
- Multilingual conversational intake (voice + text)
- AI scheme matching + plain-language explanations
- Personalized Benefits Feed
- Scheme deep-dive with eligibility + document checklist
- Basic profile persistence

**Tier 1 — Core value (v1)**
- Family profiles
- Document vault
- Application companion (guided steps)
- Reminders and renewal alerts
- Volunteer assisted mode

**Tier 2 — Trust & scale (v1.5)**
- NGO workspace with batch intake and exports
- Human handoff / call-back
- Offline-tolerant intake (sync later)

**Tier 3 — Ecosystem (v2)**
- Officer analytics console
- Partner API (CSR / cooperatives)
- Direct application submission where government APIs allow
- Proactive outreach ("3 new schemes match your family")

---

## 8. AI Strategy

**Core intelligences**
1. **Intake Agent** — conversational, empathetic, culturally-aware; extracts a structured Citizen Profile from free-form speech.
2. **Eligibility Engine** — deterministic rules layer on top of a curated Scheme Knowledge Base; AI is used for *interpretation and explanation*, not for the final eligibility verdict (auditable).
3. **Explainer Agent** — turns legalistic scheme text into 3rd-grade-reading-level answers in the user's language.
4. **Guidance Agent** — walks the user through application steps, document prep, and submission.
5. **Proactive Agent** — background matcher; notifies when new schemes fit or renewals are due.

**Guardrails**
- Every eligibility claim shows a "Why do you qualify?" trace linking to the source rule.
- Never fabricate a scheme; retrieval-grounded only.
- Sensitive fields (caste, disability, income) are opt-in with clear purpose.
- Confidence badges: *Likely eligible / Possibly eligible / Check with officer.*

**Knowledge base**
- Curated, versioned scheme corpus (central + state), tagged by eligibility dimensions.
- Human-in-the-loop review workflow for updates.

---

## 9. Voice Strategy

- Voice is a **first-class input and output**, not an accessibility add-on.
- Push-to-talk on every screen; barge-in supported.
- Supports major Indian languages + key dialects on day one (Hindi, English, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Odia). Roadmap for tribal languages.
- Voice replies are short, warm, and use local idioms — never bureaucratic.
- Persona: calm, respectful, gender-selectable, addresses elders with appropriate honorifics.
- Fallback: any voice turn can be reviewed as text; any text turn can be replayed as voice.

---

## 10. Navigation Structure

Mobile-first, thumb-reachable, minimal chrome.

- **Bottom nav (Citizen role):** Home (Conversation) · Benefits · Family · Documents · Profile
- **Persistent voice button** floating above bottom nav.
- **Contextual entry points** to Applications and Help surface inside relevant cards, not as top-level noise.
- **Role switcher** in Profile for users who are also volunteers/NGO staff.
- **Officer/NGO** roles get a dedicated desktop-optimized workspace with a left sidebar.

Design language: generous whitespace, large type, quiet color, one clear action per screen — Apple-grade restraint, Perplexity-grade answer clarity.

---

## 11. Future Scalability

- **Geographic:** state-by-state rollout; scheme corpus modular per state.
- **Linguistic:** add languages/dialects without retraining the core reasoning layer.
- **Channel:** WhatsApp bot, IVR phone line, kiosk mode for CSCs — all reusing the same intake and eligibility engines.
- **Integrations:** DigiLocker, Aadhaar-based eKYC, UMANG, state portals via APIs as they open up.
- **Partners:** CSR programs, cooperative banks, insurance sakhis via a Partner API.
- **Data flywheel:** anonymized coverage-gap insights back to government and NGOs.

---

## 12. Product Goals

**6-month goals**
- 100,000 citizens screened.
- ≥ 5 correctly-matched schemes per citizen on average.
- ≥ 60% of users complete intake in voice mode.
- ≥ 40% of matched users initiate at least one application.

**12-month goals**
- Deployed with 20+ NGO partners.
- Live in 8 states, 11 languages.
- Measurable "₹ unlocked per user" metric published transparently.

**Long-term**
- Become the default welfare interface for India — the "one number / one app you tell your parents to use."

---

## 13. User Experience Principles

1. **Conversation over forms.** If a form field can be a question, it is a question.
2. **Dignity first.** No user is ever told "you are ineligible" — they are told what they *do* qualify for.
3. **Plain language, always.** 3rd-grade reading level in every supported language.
4. **Explainability is UX.** Every recommendation shows its reasoning.
5. **Voice is equal to text.** Not a fallback, a peer.
6. **Trust through transparency.** Show data usage, consent, and sources up front.
7. **One clear next step per screen.** Never overwhelm.
8. **Assisted mode is native.** Volunteers acting on behalf of citizens is a first-class flow, not a workaround.
9. **Offline-tolerant.** Field workers must be able to intake without connectivity.
10. **Feels like Apple + Perplexity + a kind welfare officer — never like a sarkari website.**

---

## Next Step

Approve this blueprint (or request edits). Once approved, the next discovery artifact will be the **Design System + Screen Inventory** — still no code — followed by the **AI + Data Architecture** doc. Only after those are signed off do we move to build.
