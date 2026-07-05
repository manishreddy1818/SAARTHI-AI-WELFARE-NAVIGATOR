# SAARTHI — Design System & Screen Inventory (Discovery Phase II)

Discovery only. No code, components, or pages in this phase. This document builds on the approved Product Blueprint (`.lovable/plan.md`) and becomes the design contract every screen must honor.

Design north-star: **Apple Human Interface × Perplexity AI × Linear × ChatGPT Voice Mode**. Never a government portal.

---

## PART A — DESIGN SYSTEM

### A1. Brand Feel
- Warm, calm, confident. A trusted welfare officer, not a bureaucrat.
- Voice-first, not form-first.
- Generous whitespace. Big type. One clear action per screen.

### A2. Color System (semantic tokens, oklch)

Light mode is the default; dark mode is a first-class peer.

| Token | Purpose | Direction |
|---|---|---|
| `--background` | App canvas | Warm off-white ivory (light) / deep ink navy (dark) |
| `--foreground` | Primary text | Near-black warm charcoal / warm off-white |
| `--surface` | Cards, sheets | 1 step lighter than background with subtle warmth |
| `--surface-elevated` | Modals, popovers | Slight tint + soft shadow |
| `--primary` | SAARTHI signature | Deep saffron-indigo blend — warm, Indian-rooted, non-partisan |
| `--primary-foreground` | Text on primary | Ivory |
| `--primary-glow` | Voice orb halo | Higher-chroma variant of primary |
| `--accent` | Highlights, focus | Warm gold (trust, dignity) |
| `--success` | Eligible / Approved | Calm sage green |
| `--warning` | Missing docs / Renewals | Warm amber |
| `--destructive` | Rejected / Errors | Muted terracotta (never harsh red) |
| `--muted` / `--muted-foreground` | Secondary text | Warm neutral grays |
| `--border` | Hairlines | Very low contrast |
| `--ring` | Focus | 2px accent, always visible |

Gradients (as tokens, not one-off inline):
- `--gradient-primary` — hero backgrounds, voice orb
- `--gradient-aurora` — subtle multi-hue wash for splash + AI screens
- `--gradient-surface` — card hover lift

Shadows:
- `--shadow-soft` — resting card
- `--shadow-lift` — hover / active card
- `--shadow-orb` — voice orb glow (color-mixed from `--primary`)

Rule: **no hardcoded colors in components**. Every color flows through `src/styles.css` tokens.

### A3. Typography

Two-family system, both with excellent Devanagari + Latin coverage:
- **Display / Headings:** a modern humanist sans (candidates: *Inter Display*, *General Sans*, *Sora*) — for confident, quiet headlines.
- **Body / UI:** a highly-readable neutral sans (candidates: *Inter*, *Manrope*) — for long-form scheme text.
- **Indic pairing:** *Noto Sans Devanagari* / *Noto Sans Tamil* / etc. loaded per active language.

Scale (mobile-first, generous):
- Display XL 48 / 56 — Splash, hero
- Display L 36 / 44 — Section headers
- Title 28 / 36 — Screen titles
- Heading 22 / 30 — Card titles
- Body L 18 / 28 — Default body (larger than typical for accessibility)
- Body M 16 / 24 — Secondary text
- Caption 14 / 20 — Metadata
- Micro 12 / 16 — Reserved (never for content)

Rules: minimum body size 16px, minimum line-height 1.5, max line-length 68ch, headings never ALL CAPS except tiny eyebrow labels.

### A4. Spacing, Radius, Elevation
- **Spacing scale:** 4, 8, 12, 16, 20, 24, 32, 40, 56, 72, 96. Screens breathe.
- **Radius:** `sm 10 / md 14 / lg 20 / xl 28 / 2xl 36 / full`. Cards default to `xl`. Voice orb `full`.
- **Elevation:** three tiers only — resting, hover, floating (modal/sheet). Never harsh drop shadows.
- **Glassmorphism:** used sparingly on the AI Assistant surface and the persistent voice button — `backdrop-blur` + `--surface` at 70% + hairline border.

### A5. Iconography & Imagery
- Line-icon set, 1.5px stroke, rounded caps. Consistent optical size.
- Illustrations: warm, human, culturally-inclusive; avoid clip-art stock. Prefer abstract shapes + real photography of people.
- No flags, no emblems, no government seals — reinforces "not a sarkari site."

### A6. Motion Language
- Curve: `cubic-bezier(0.22, 1, 0.36, 1)` (calm ease-out) for entrances; symmetric for exits.
- Durations: 150ms micro, 240ms standard, 420ms hero.
- Signature motions:
  - **Voice pulse** — orb breathes at 1.2s cycle when listening, faster + amplitude-reactive when speaking.
  - **AI thinking** — three dots morph into a shimmer bar; never a spinner.
  - **Card hover** — 2px lift + shadow deepen, no scale-up above 1.02.
  - **Route transitions** — soft cross-fade + 8px vertical slide.
  - **Skeletons** — shimmer, not spinners; match final layout exactly.
- Respect `prefers-reduced-motion` globally.

### A7. Component Primitives (design contract — implementation later)
Buttons (Primary / Secondary / Ghost / Destructive / Icon / Voice), Input, Textarea, Select, Combobox, Checkbox, Radio, Switch, Slider, Chip / Tag, Badge (Eligible/Pending/Approved/Rejected/Renewal), Card, ListItem, SchemeCard, FamilyMemberCard, DocumentCard, ApplicationCard, Tabs, Segmented Control, Modal, Sheet (bottom, mobile), Drawer, Toast, Tooltip, Popover, Progress (linear + step), Skeleton, EmptyState, Avatar, LanguagePicker, VoiceOrb (S/M/L), AI Message Bubble (user / assistant / system), ConfidenceMeter, EligibilityTrace, StepIndicator, BottomNav, Sidebar (partner), Header.

Every interactive element: min 44×44px target, visible focus ring, keyboard accessible, screen-reader labeled.

### A8. Voice UX Primitives
- **Voice Orb** — the product's mascot. Four states: idle, listening, thinking, speaking. Each state has a distinct halo + motion signature but the same silhouette.
- **Push-to-talk** — persistent floating button; long-press to speak, release to send; barge-in supported.
- **Transcript rail** — every voice turn produces text; text is always the source of truth.
- **Language chip** — always visible near the orb; one tap to switch.

### A9. Accessibility Contract
- WCAG 2.2 AA minimum, AAA for body text contrast.
- Every icon-only control has `aria-label`.
- Every image has meaningful `alt` (or `alt=""` if decorative).
- Landmarks: single `<main>`, proper heading order, skip-link on every page.
- Full keyboard operability, visible focus, no keyboard traps.
- Mobile viewport uses `dvh`, tap targets ≥ 44px.
- "Simple Language Mode" toggle globally reduces reading grade.

---

## PART B — INFORMATION ARCHITECTURE & NAVIGATION

### B1. Route Map (flat, TanStack Start conventions)

```text
/                         Splash Experience (first visit) → Landing
/welcome                  Landing (marketing home)
/journey                  Choose Your Journey
/auth/login               Login
/auth/signup              Signup
/auth/forgot              Forgot password
/auth/language            Language + accessibility setup
/app                      Citizen shell (bottom nav)
  /app                    Citizen Dashboard (home)
  /app/assistant          AI Assistant
  /app/benefits           Benefits Feed
  /app/benefits/$id       Scheme Details
  /app/family             Family Dashboard
  /app/family/$memberId   Member detail
  /app/documents          Documents
  /app/applications       Applications
  /app/applications/$id   Application detail
  /app/profile            Profile
/stories                  Citizen Journey Gallery (public)
/stories/$slug            Story deep-dive (interactive demo)
/partner                  Welfare Partner shell (sidebar)
  /partner                Partner Dashboard
  /partner/citizens       Citizens list
  /partner/intake         Voice Intake
  /partner/reports        Reports
  /partner/impact         Impact Dashboard
  /partner/profile        Profile
```

### B2. Navigation Patterns

**Citizen (mobile-first):** Bottom nav — *Home · Benefits · Family · Documents · Profile*. Persistent floating **Voice Orb** above the nav on every screen.

**Partner (desktop-first):** Left sidebar — *Dashboard · Citizens · Voice Intake · Reports · Impact · Profile*. Top bar with global search + language.

**Public (marketing):** Slim top nav — logo, *Stories*, *For Partners*, *Sign in*, *Start AI* (primary).

Role switcher lives in Profile for users who hold multiple roles.

---

## PART C — COMPLETE SCREEN INVENTORY

Each screen specifies: **Purpose · Layout · Components · Content · Primary Action · Secondary Actions · Empty/Loading/Error states · Accessibility notes · Motion notes**.

### Screen 1 — Splash Experience  `/`
- **Purpose:** Create emotional connection in ≤ 8 seconds. Introduce SAARTHI's soul before its UI.
- **Layout:** Full-bleed aurora gradient; centered stage; no chrome.
- **Sequence (auto-advancing, skippable):**
  1. Animated logomark draws in (0–1.2s).
  2. Line 1: *"Crores of citizens miss benefits they deserve."* (fade up).
  3. Line 2: *"Not anymore."*
  4. SAARTHI wordmark + tagline: *"Your AI Welfare Navigator."*
  5. Voice greeting (autoplay only if user gestured; otherwise button): *"Namaste. Main SAARTHI hoon."*
  6. Primary CTA: **Get Started** → `/journey`.
- **Components:** Logomark, GradientBackdrop, VoiceOrb (idle → speaking), TextRevealSequence, PrimaryButton, SkipLink.
- **States:** first-visit only (localStorage flag); returning users go straight to `/welcome` or `/app`.
- **Motion:** slow, cinematic; single skip control; respects reduced-motion (static poster).
- **A11y:** Skip button focused first; captions for the voice greeting; screen reader reads the full sequence at once.

### Screen 2 — Landing Page  `/welcome`
- **Purpose:** Convert curious visitors into first-time citizens/partners.
- **Sections (top-to-bottom):**
  1. **Hero** — Big claim, subhead, Primary **Start AI** + Secondary **Explore Citizen Stories**. Ambient voice orb.
  2. **Problem** — Three stat cards: schemes count, avg unclaimed benefit, awareness gap.
  3. **Solution** — SAARTHI in one sentence + product screenshot mock.
  4. **Features** — Bento grid: Voice-first · Multilingual · Family mode · Document vault · Guided applications · Volunteer-assist.
  5. **How It Works** — 4-step narrative (Talk → Match → Explain → Apply).
  6. **AI Benefits** — Why AI beats forms (dignity, speed, personalization, explainability).
  7. **Citizen Stories** — Carousel of 5 personas from the Journey Gallery.
  8. **Testimonials** — NGOs, volunteers, officers.
  9. **FAQ** — Data privacy, cost (free), languages, offline, official-source guarantee.
  10. **Footer** — Language switch, Partners CTA, contact, privacy, T&C, credits.
- **Primary Action:** Start AI (persistent in header after scroll).
- **A11y:** Semantic sections with landmarks; heading order strict.

### Screen 3 — Choose Your Journey  `/journey`
- **Purpose:** Route the user to the right product surface.
- **Layout:** Three oversized cards on desktop, stacked on mobile.
  - **Citizen** — "Find benefits for me or my family." → `/auth/signup?role=citizen`
  - **Welfare Partner** — "Screen citizens, run campaigns, measure impact." → `/auth/signup?role=partner`
  - **Explore Citizen Stories** — "See SAARTHI in action, no signup." → `/stories`
- **Components:** JourneyCard (icon, title, one-line, sample tags, CTA), LanguageChip in header.
- **Motion:** Cards lift + halo on hover; enter with staggered fade.

### Screen 4 — Authentication  `/auth/*`
- **Purpose:** Frictionless entry. OTP-first; passwords are secondary.
- **Screens:**
  - **Login** — Phone/email + OTP; "Continue with Google" (optional).
  - **Signup** — Same as login + name, role (prefilled from `?role`), consent checkbox.
  - **Forgot Password** — Only for email accounts.
  - **Language Selection** — Big language chips (native script rendered natively); default from device.
  - **Accessibility Options** — Text size (S/M/L/XL), high-contrast toggle, voice-first toggle, reduce motion.
- **Layout:** Single centered card, generous padding, one primary action per step.
- **A11y:** Autofocus first input; OTP fields as one accessible group; error text tied via `aria-describedby`.

### Screen 5 — Citizen Dashboard  `/app`
- **Purpose:** "Where do I stand today?" — a calm, non-overwhelming home.
- **Layout (mobile-first, single column):**
  1. **Greeting header** — "Namaste, Ramesh ji" + weather-of-benefits sentence: "3 new schemes match you this month."
  2. **Estimated Benefits card** — headline number ("₹48,200/year unlocked") + trend chip.
  3. **Recommended Actions** — 2–3 next best steps (e.g. "Upload Aadhaar to unlock 4 schemes").
  4. **Applications strip** — horizontal cards of in-flight applications with status.
  5. **Family Members strip** — avatars + per-person eligible count.
  6. **Recent Activity** — timeline of AI conversations, saved schemes, doc uploads.
  7. **Quick AI button** (large) + persistent Voice Orb.
- **Primary Action:** Talk to SAARTHI (opens `/app/assistant`).
- **Empty state:** first-time users see a friendly intake CTA instead of the strips.

### Screen 6 — AI Assistant  `/app/assistant`
- **Purpose:** The heart of the product. A calm, focused conversation surface.
- **Layout:** Full-height, single-column, minimal chrome.
  - **Top bar:** back, language chip, "New conversation".
  - **Center stage:** large **Voice Orb** with state animation and live captions.
  - **Transcript rail:** message bubbles above/below orb; auto-scroll.
  - **Suggested prompts:** 3 chips ("Am I eligible for pension?", "Schemes for my daughter", "Explain PMAY").
  - **Composer:** push-to-talk button (primary), text input (secondary), attach doc, stop-speaking.
- **States of Orb:** idle (breathe) · listening (amplitude ring) · thinking (shimmer bar) · speaking (waveform halo).
- **Behaviors:** barge-in, live transcript, source citations under assistant messages, "Why this answer?" reveals eligibility trace, save-to-benefits action on any scheme mention.
- **Empty:** greeting + suggested prompts.
- **Error:** "I didn't catch that" with retry + switch-to-text.
- **A11y:** captions on by default; full keyboard alternative for every voice action.

### Screen 7 — Benefits Feed  `/app/benefits`
- **Purpose:** Personalized, ranked list of schemes.
- **Layout:** Filter bar (All · Eligible · In Progress · Saved · Renewals) + list of **SchemeCard**s.
- **SchemeCard content:** Scheme name, one-line summary, **Priority** badge, **Estimated Benefit** (₹/year or one-time), **Eligibility Status** (Likely / Possibly / Check with officer), **Confidence meter**, actions: **Apply · Save · Learn More**.
- **Sort/Filter:** by benefit value, ease of claim, renewal urgency, category.
- **Empty:** intake CTA. **Loading:** shimmer cards. **Error:** retry + offline notice.

### Screen 8 — Scheme Details  `/app/benefits/$id`
- **Purpose:** Deep, trustworthy, plain-language explanation of one scheme.
- **Sections:**
  1. Hero — Name, category, benefit headline, eligibility badge, confidence.
  2. **Description** — 3rd-grade language.
  3. **Why you're eligible** — bullet list mapped to profile facts.
  4. **Eligibility rules** — expandable full rule text with source link.
  5. **Required documents** — checklist tied to Documents vault (green tick if uploaded).
  6. **Application steps** — numbered stepper with estimated time each.
  7. **Timeline** — expected processing time, past user averages.
  8. **Official link** — clearly labeled outbound.
  9. Sticky action bar: **Apply with SAARTHI (primary) · Save · Ask AI**.
- **A11y:** eligibility trace fully keyboard-reachable; outbound links marked.

### Screen 9 — Family Dashboard  `/app/family`
- **Purpose:** Manage entitlements for the whole household.
- **Layout:** Grid of **FamilyMemberCard**s + "Add member" CTA.
- **Each card:** avatar, name, relationship, age, eligible-count, in-progress-count, tap → member detail.
- **Member detail** (`/app/family/$memberId`): profile summary, eligible schemes, active applications, uploaded documents, progress bar toward "fully covered."
- **Empty:** guided prompt to add first member (voice or form).

### Screen 10 — Documents  `/app/documents`
- **Purpose:** Reusable vault; kills the biggest friction in applications.
- **Layout:** Two tabs — **My Documents** · **Checklist**.
- **My Documents:** grid of DocumentCards (thumbnail, name, expiry chip, linked-to badge).
- **Checklist:** categories (Identity, Address, Income, Caste, Disability, Bank) with per-item status: uploaded / missing / expiring.
- **Actions:** Upload (camera / gallery / DigiLocker), Download, Delete, Share to application.
- **Suggestions:** "Upload PAN to unlock 3 more schemes."
- **A11y:** OCR'd docs get alt text; upload is keyboard + voice accessible.

### Screen 11 — Applications  `/app/applications`
- **Purpose:** Track everything in flight.
- **Layout:** Segmented control (All · Pending · Submitted · Approved · Rejected) + list of **ApplicationCard**s.
- **Card:** scheme name, status badge, last update, next action CTA.
- **Detail** (`/app/applications/$id`): step timeline with completed / current / upcoming states, documents attached, officer contact if available, "Talk to a volunteer" fallback.
- **Empty:** "No applications yet — let's find your benefits."

### Screen 12 — Citizen Journey Gallery  `/stories` + `/stories/$slug`
- **Purpose:** Show, don't tell. A public showcase of SAARTHI in action.
- **Gallery layout:** Bento of 5 preloaded personas — **Senior Citizen · Farmer · Student · Woman Entrepreneur · Disabled Citizen**.
- **Story layout:** interactive replayable conversation with the AI assistant (scripted, not live). Play/pause, step-through, "Try this yourself" CTA that seeds `/app/assistant` with the same profile.
- **Empty/Error:** static transcript fallback if audio can't play.

### Screen 13 — Welfare Partner Dashboard  `/partner`
- **Purpose:** Operational cockpit for NGO/partner staff.
- **Layout (desktop):** Sidebar + top bar + workspace.
- **Widgets:**
  - KPI row: Citizens Assisted · Applications · Follow-ups Due · Impact (₹ unlocked).
  - **Quick Intake** button (opens Voice Intake).
  - Recent citizens table with filter/search.
  - Follow-ups queue with due-today highlight.
  - Reports shortcut.

### Screen 14 — Impact Dashboard  `/partner/impact`
- **Purpose:** Prove the outcome; export for funders/government.
- **Widgets:** Citizens Helped · Benefits Unlocked (₹) · Applications Submitted · Approval Rate · Family Coverage %. Trend charts (weekly/monthly), geography breakdown, top schemes, unclaimed opportunities.
- **Actions:** Export CSV/PDF, share link, date range.

### Screen 15 — Profile  `/app/profile` and `/partner/profile`
- **Purpose:** Personal control center.
- **Sections:** Personal Information · Language · Accessibility (text size, contrast, reduce motion, simple-language mode) · Voice Settings (persona voice, autoplay, captions) · Notifications (renewals, new-scheme alerts, family) · Role Switch · Data & Consent · Logout.
- **A11y:** every toggle has a clear label + short helper text.

### Screen 16 — Voice Intake (Partner)  `/partner/intake`
- **Purpose:** Volunteer speaks on behalf of a citizen; SAARTHI captures a Citizen Profile in one session.
- **Layout:** Split — left: live transcript + extracted profile fields updating in real time; right: Voice Orb + citizen consent chip + save/print buttons.
- **Outcome:** creates a citizen record + a shareable benefits summary (WhatsApp / PDF / print).

---

## PART D — CROSS-CUTTING PATTERNS

### D1. States (mandatory for every screen)
- **Loading:** skeletons matching final layout, never spinners.
- **Empty:** friendly illustration + one clear next step.
- **Error:** plain-language message + retry + human-help escape hatch.
- **Offline:** banner + read-only cached view where possible.

### D2. Feedback
- Toasts for background actions; inline confirmations for destructive actions; haptic-like micro-motion on success.

### D3. Language & Simplicity
- Every string authored in English then translated; no idioms that break in translation.
- Simple Language Mode strips jargon and shortens sentences globally.

### D4. Privacy & Trust
- First-time sensitive prompt (caste, disability, income) is always explained: *"Why we ask · How we use it · You can skip."*
- "Sources" chip on every AI answer.
- Data & Consent screen: what we store, export my data, delete my data.

---

## PART E — DELIVERY CHECKLIST (for next phase)

Before build begins, the following must be signed off:
1. Final color values (light + dark) in oklch.
2. Font choices confirmed (with Indic coverage tested).
3. Voice orb motion spec (video/gif reference).
4. Copy tone guide for AI persona (sample prompts + refusals).
5. Scheme card + Application card visual comps.
6. Empty/loading/error illustrations set.

---

## Next Step

Approve this Design System & Screen Inventory. On approval, the next discovery artifact is the **AI + Data Architecture** document (scheme knowledge base schema, eligibility engine, agent orchestration, voice pipeline, storage & consent model) — still no code. Only after that is signed off do we move to build.
