## Part 1 — "Invalid API key" on sign-up

Email-confirmation has already been disabled (auto_confirm is on), so signup itself should now succeed without verification. The "invalid API key" message is therefore almost certainly **not** an OpenAI/Anthropic/Google/Twilio key — none of those are touched during sign-up. It's the **Supabase publishable (anon) key** the browser sends with the auth request.

Most likely causes after a remix:

1. The browser still has a stale `.env` bundle cached — a hard refresh (Cmd+Shift+R) usually fixes it.
2. The previous project's anon key was baked into a hard-coded fallback in `vite.config.ts` (memory note flags this) and is overriding the new remixed key.

**Plan for Part 1**

- Inspect `vite.config.ts` for any hard-coded `VITE_SUPABASE_PUBLISHABLE_KEY` / project ID fallbacks left over from the source project, and replace them with the remixed values from `.env`.
- Confirm `src/integrations/supabase/client.ts` reads only from `import.meta.env` (it does).
- Ask user to hard-reload after the fix and re-attempt signup. If it still fails, rotate the Supabase API keys.
- No third-party secret needs updating for signup. Twilio/OpenAI/Anthropic/Google updates can be deferred until those features are exercised.

---

## Part 2 — CHW persona (Friendship Bench / lay-counsellor model)

### Goals

- CHW is the **first port of call**: lightweight, supportive, non-clinical.
- Strict separation from clinician account; cannot reach diagnostic / treatment / crisis-protocol modules.
- Can manage **multiple parallel client sessions** (up to 5 active), append new sessions to the same client, save-and-close, end-and-archive, or refer upward.
- Same audio-capture pipeline as the psychiatrist (chunked 50 s transcription, multi-language).
- PHQ-9 only for screening; PHQ-9 Item 9 ≥ 1 forces an upward-referral pathway.
- Referral targets chosen from a registry of nurses, psychiatrists, and emergency facilities.

### What already exists (reuse, don't rebuild)

- `app_role` enum + `user_roles` table + `has_role()` helper.
- `src/lib/permissions.ts` with `isCHW`, `canProcessNarrative`, etc.
- `CHWReferralForm.tsx` (basic version — needs facility dropdown + urgency-driven routing).
- `useAudioRecorder` hook + `InputZone` recording UI (chunked at 50 s).
- `PHQ9Form` with auto-scoring and Item-9 alert.
- `patients`, `screening_assessments`, `referrals`, `audit_events` tables.

### Gaps to fill

**Database (migration)**

- Add `'chw'` to `app_role` enum (currently the enum has admin/moderator/user/psychiatrist; CHWs are being approximated). Confirm and add if missing.
- New table `chw_sessions` — one row per CHW encounter:
  - `id`, `chw_id` (auth uid), `patient_id`, `session_number` (int, 1-based per patient), `status` (`active` | `completed` | `referred` | `archived`), `narrative_text`, `transcript_language`, `phq9_score`, `phq9_severity`, `phq9_item9_flag`, `notes`, `started_at`, `ended_at`, `created_at`, `updated_at`.
  - RLS: CHW reads/writes only their own; admins read all.
  - Trigger: cap at 5 simultaneous `status='active'` sessions per CHW (raise exception in BEFORE INSERT/UPDATE).
  - Trigger: auto-increment `session_number` per `(chw_id, patient_id)` so session #2, #3 are appended, not resumed.
- New table `referral_targets` — facility/specialist directory:
  - `id`, `name`, `target_type` (`nurse` | `psychiatrist` | `emergency_centre` | `clinic`), `contact_phone`, `contact_email`, `address`, `is_active`. Seeded with a few example rows; admin-managed.
  - Public read for authenticated users; admin write.
- Extend `referrals` to optionally link `chw_session_id` (nullable FK).
- Audit hooks: insert `audit_events` rows on session start, save-and-close, end, refer.

**Sign-up flow**

- New "Sign up as Community Health Worker" tab on `/auth` (separate from clinician sign-up).
- On CHW sign-up, the trigger assigns role `chw` (not `psychiatrist`).
- Update `handle_new_user` so the role is read from `raw_user_meta_data->>'intended_role'` (defaulting to `psychiatrist` for backward compatibility), set during sign-up via `options.data`.

**CHW dashboard (new route `/chw`)**
A dedicated, simplified UI — *not* the clinician `Index.tsx` with hidden tabs:

- **Header**: large role badge "Community Health Worker", help button.
- **Active Sessions strip**: cards for up to 5 active sessions (patient identifier, started time, last activity, "Resume", "End"). Cap enforced.
- **Tabs**:
  1. **Clients** — register a new client (re-use `PatientForm`), list existing clients with their session history.
  2. **New Session** — pick or register a client → opens session workspace.
  3. **Referrals** — list of referrals this CHW has sent + status.
  4. **History** — completed/archived sessions, read-only.

**Session workspace component (`CHWSessionWorkspace.tsx`)**

- Audio recorder (re-uses `useAudioRecorder` + transcription pipeline — identical schema/chunking to clinician).
- Narrative text area populated by transcription.
- "Run PHQ-9" button → renders `PHQ9Form` (already saves to `screening_assessments`); on submit, score is copied onto `chw_sessions`.
- Item-9 ≥ 1 → red banner with safety guidance + auto-opens **Refer Up** drawer; cannot be dismissed without choosing a target.
- Footer action bar:
  - **Save & Pause** (status remains `active`, narrative+score persisted).
  - **Save & Close** (status → `completed`, ended_at set; client record kept for future return).
  - **End Session without Save** (status → `archived`, narrative discarded; confirmation required).
  - **Refer Up** (status → `referred`; opens upgraded `CHWReferralForm`).
- "Start Session 2" appears on a client who already has a closed session — creates a new row with `session_number = previous + 1` (appended, not resumed).

**Upgraded `CHWReferralForm.tsx**`

- Two-step picker: target type (Nurse / Psychiatrist / Emergency Centre) → pulls matching rows from `referral_targets` + registered clinicians from `profiles`+`user_roles`.
- Urgency mapped to action: `routine` (24-h window), `urgent` (same-day), `emergency` (auto-pre-fills emergency centre + shows phone numbers).
- Free-text concern note + auto-attached transcript and PHQ-9 score.
- Writes to `referrals` with `context='chw_upward_referral'` and `chw_session_id` set; flips session status to `referred`.

**Routing & guards**

- Add `/chw` route in `App.tsx` wrapped in a guard that redirects clinicians to `/` and CHWs away from `/`.
- Update `Index.tsx` to early-redirect `chw` role to `/chw`.

**Permissions tightening**

- Server-side: edge functions `process-narrative`, `suggest-diagnosis`, `generate-treatment-plan` should reject callers with `chw` role (read JWT claim + cross-check `user_roles`). Defence-in-depth, even though the UI hides them.
- Client-side: `permissions.ts` already covers UI gating — extend with `canStartChwSession`, `canAccessChwDashboard`, `canManageReferralTargets` (admin only).

### Files to create / modify


| File                                         | Action                                                                                |
| -------------------------------------------- | ------------------------------------------------------------------------------------- |
| `vite.config.ts`                             | Remove stale Supabase fallbacks                                                       |
| migration                                    | `chw_sessions`, `referral_targets`, RLS, triggers, role-routing in `handle_new_user`  |
| `src/pages/Auth.tsx`                         | Add "Sign up as CHW" path (sets `intended_role: 'chw'`)                               |
| `src/pages/CHWDashboard.tsx`                 | New — CHW home with the four tabs                                                     |
| `src/components/chw/CHWSessionWorkspace.tsx` | New — recording + PHQ-9 + action bar                                                  |
| `src/components/chw/ActiveSessionsStrip.tsx` | New                                                                                   |
| `src/components/chw/CHWClientList.tsx`       | New                                                                                   |
| `src/components/chw/CHWHistory.tsx`          | New                                                                                   |
| `src/components/CHWReferralForm.tsx`         | Upgrade with target-type picker + facility directory                                  |
| `src/lib/permissions.ts`                     | Add `canAccessChwDashboard`, etc.                                                     |
| `src/App.tsx`                                | Add `/chw` route + redirect logic                                                     |
| `src/pages/Index.tsx`                        | Redirect CHW role away                                                                |
| Edge functions                               | Add role check in `process-narrative`, `suggest-diagnosis`, `generate-treatment-plan` |


### Out of scope for this pass (Phase 2)

- Admin UI for managing `referral_targets` (DB-seeded rows are enough to start).
- Offline sync for CHW field use.
- SMS dispatch of referrals via Twilio (data is captured; dispatch can wire up later).

### Open questions before I implement

1. Should CHWs be able to **register new patients themselves**, or only see patients pre-registered by a clinician? (Friendship-bench model says yes — they register.) - YES THEY CAN WITH PII EMBEDDED
2. Is the **5 simultaneous active sessions** cap correct, or per-patient limit instead? EACH PATIENT CAN HAVE 5 CONSECUTIVE SESSIONS. THEY HAVE ONE TODAY, IT IS SAVED ITHER TO RESUME LATER IN THE DAY OR TOMORROW (IF CUT OFF UNEXPECTADLY) OR SAVED AS COMPLETE SO NEXT TIME WE START ON SESSION 2
3. For the referral-target directory, is it OK to seed Zimbabwe-relevant emergency numbers (e.g. ZRP, public hospitals) as defaults, or do you want it empty until an admin populates?. YES THIS IS OK, THEY CAN BE EDITED WITH REAL SUBSCRIBERS LATER
4. On "End Session without Save", should the audio recording also be discarded, or kept in cold storage for governance/audit even if the narrative isn't? I THINK EVERYTHING IS DISCARDED IN CASE A RECORDING WAS DONE UNINTENTIONALLY