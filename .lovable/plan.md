## Goal

Add a public, consumer-facing **Mental Health Self-Assessment** flow (no login required) that:

1. Walks an individual through consent → demographics → PHQ-9 → optional narrative (text/voice/document).
2. Matches them to nearby MH facilities/practitioners via **browser geolocation + region fallback**.
3. Submits an anonymised referral packet to the chosen recipient (clinician / ER / CHW), including **AI-suggested clinical diagnoses** that are visible **only to the receiving practitioner**, not the self-assessor.
4. Surfaces inbound referrals to recipients via a **Facility Portal** (clinician/ER) and the **CHW workspace**.

The self-assessor only sees: confirmation, crisis support if flagged, list of matched services. Clinical interpretation stays on the recipient side.

---

## Scope

### New public route — `/self-assess`

Replicates the uploaded `selfassess.tsx` design (welcome → consent → demographics → PHQ-9 → narrative → result), with these adjustments to the original:

- **Geolocation step** added to demographics: ask permission via `navigator.geolocation`, store lat/lng. Region dropdown becomes the manual fallback.
- **Result page** lists facilities ranked by distance (Haversine) when coordinates available; otherwise falls back to region match.
- Uses existing `transcribe-audio` and `process-document` edge functions (already in project) for voice/document narrative input.
- Uses existing `SUPPORTED_LANGUAGES` and shared design tokens.

### New public route — `/facility` (Facility Portal)

For authenticated clinicians (psychiatrist/admin role). Lists inbound `facility_referrals` for facilities they belong to, with full clinical view: PHQ-9 score+severity+Item-9 flag, narrative, transcript, **AI-suggested differential diagnoses + cultural formulation** (generated server-side via existing `suggest-diagnosis` edge function on submission). Accept / decline / escalate actions, SLA timer.

### CHW inbound referrals

Extend existing `CHWDashboard` with a "Self-Referrals" tab that surfaces `facility_referrals` routed to a CHW-tier facility (or unassigned, when no facility exists in region). Same clinical view as the Facility Portal.

### Database (migration)

Following the uploaded SQL, with two changes:

- Add `latitude numeric`, `longitude numeric` to `self_assessment_sessions` and `facilities`.
- Add `ai_diagnostic_suggestions jsonb` to `self_assessment_sessions` (populated server-side at "complete"; never returned to the public client).

Tables: `self_assessment_sessions`, `self_assessment_consents`, `self_assessment_responses`, `facilities`, `facility_referrals`. RLS exactly as uploaded — public has zero direct DB access; all writes through the `self-assess` edge function via service role; reads of clinical data restricted to admins + facility members + assigned CHWs.

### New edge function — `self-assess`

Single endpoint handling actions: `start`, `save_consents`, `save_demographics`, `save_screening`, `save_narrative`, `complete`. Deployed with `verify_jwt = false` (public). Uses service role internally, validates inputs with Zod, hashes IP for consent records, runs `suggest-diagnosis` on `complete` and stores result on the session. Match logic: geolocation distance when available, region match otherwise; create `facility_referrals` rows; return only facility contact info to the caller.

### Auth changes

- Update `App.tsx` to match the uploaded version (RoleGuard + new routes).
- `/self-assess` and `/facility` (login wall) and `/chw` already covered.
- No verification toggle needed — instant signup is already configured per prior turn.

---

## Out of scope (call out for later)

- Admin UI to manage `facilities` directory (seed data only via migration for now).
- Practitioner-level matching (only facility-level in v1).
- Two-way messaging between patient and facility.
- Live notifications/SMS to facilities (referral row + portal polling only; Twilio dispatch deferred).

---

## Technical notes

```
Public browser  ──► /self-assess (no auth)
                       │ POST /functions/v1/self-assess
                       ▼
              Edge fn (service role)
                ├─ writes session/consents/responses
                ├─ on `complete`:
                │    ├─ calls suggest-diagnosis  ──► stored on session (recipient-only)
                │    └─ matches facilities by lat/lng (Haversine) or region
                ├─ inserts facility_referrals rows
                └─ returns: { facilities[], is_crisis }   ← NO diagnosis fields

Authenticated clinician ──► /facility   ──► reads referrals + diagnostic suggestions
Authenticated CHW       ──► /chw "Self-Referrals" tab
```

Files to create:

- `src/pages/SelfAssess.tsx` (from upload, with geolocation addition)
- `src/pages/FacilityPortal.tsx` (inbox + clinical detail view)
- `src/pages/CHWWorkspace.tsx` *or* extend existing `CHWDashboard.tsx` with a Self-Referrals tab (will use the existing dashboard to avoid duplication)
- `src/components/RoleGuard.tsx`
- `supabase/functions/self-assess/index.ts`
- Migration: tables above + seed a handful of Zimbabwe/SA facilities

Files to edit:

- `src/App.tsx` — adopt the uploaded routing (with `RoleGuard`).
- `src/components/Footer.tsx` *(if needed)* — link to `/self-assess` from public surface.
- `supabase/config.toml` — `[functions.self-assess] verify_jwt = false`.

---

## Open questions

1. **Recipient routing on submission** — when both a facility and a CHW serve the same region, who receives by default?
  - (a) Facility first, CHW only if no facility (current uploaded SQL behaviour)
  - (b) Always both
  - (c) Patient picks from the matched list [THE PERSON ASSESSING THEMSELVES SELECTS WHERE THEY WANT TO ROUTE THEIR SUBMISSION TO - ITS NOT AN AUTOMATED PROCESS. THEY CHOSE WHERE IT WILL BE SUBMITTED TO]
2. **Facility seed data** — happy with me seeding ~6 placeholder Zimbabwe + SA facilities for testing, or do you want the directory to start empty? YES
3. **CHW page** — extend existing `CHWDashboard` (recommended) or create a new `CHWWorkspace.tsx` per the uploaded `App.tsx`? OK