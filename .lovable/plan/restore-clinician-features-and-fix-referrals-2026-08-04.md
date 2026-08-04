# Restore clinician features and fix referrals

I traced all five symptoms. Four of them have a single shared root cause, and it is confirmed in the data, not guessed.

## Root cause 1 — one bad role lookup hides most of your dashboard

Your account now holds two roles (`admin` and `principal_investigator`, added during the audio/FHIR work). The app's role lookup asks the database for exactly one row and treats "more than one" as an error, so it silently falls back to "no role". Every clinician surface is gated on that value, which is why Process Narrative, Ask AI, all non-PHQ-9 screening tools, the diagnostics panels and the Admin Console link all vanished at once, for your account specifically.

Fix: read all roles for the user, keep them as a list, and pick the highest-privilege one as the active role (admin > principal_investigator > safety_monitor > psychiatrist > chw > viewer). Nothing else about the gating changes — the features come straight back.

## Root cause 2 — referrals rejected by outdated database rules

The `referrals` table still only permits the old values:
- `context` limited to `crisis_intervention`, `treatment_plan`, `general` — the CHW picker sends `chw_upward_referral`.
- `urgency` limited to `immediate`, `urgent`, `routine` — the picker sends `emergency`.

So every upward referral fails, which is also why the session stays "active pending resume" and Save & Close remains blocked by the suicidality flag: the blocking condition is only cleared by a successful emergency referral.

Fix: a migration widening both rules to include the values the app actually sends (`chw_upward_referral`, `self_referral`, `facility_referral`; `emergency`). No data is lost or rewritten.

## Root cause 3 — new patients need a tab change to appear

The patient list subscribes to live database changes, but no table is published for realtime, so the subscription never fires. Fix: refresh the list directly after a patient is created (and keep the live subscription as a bonus by enabling realtime on the patients table).

## Safety behaviour after the fix

The suicidality gate stays. Once referrals succeed again, an emergency referral clears the flag and the session can be closed. I will also make the blocked-state message point at the referral action instead of being a dead end.

## Technical changes

- `src/contexts/AuthContext.tsx`: fetch all `user_roles` rows, expose `userRoles: string[]` plus a precedence-resolved `userRole`; remove `.single()`.
- Migration: replace `referrals_context_check` and `referrals_urgency_check` with widened allow-lists; add `patients` to the realtime publication with replica identity full.
- `src/components/PatientList.tsx` / `PatientHub.tsx`: call the fetch on patient-created success so the list updates immediately.
- `src/components/chw/CHWSessionWorkspace.tsx`: clearer wording on the blocked Save & Close, jump to the referral panel.
- Verify end to end in a headless browser: sign-in as admin shows Process Narrative, Ask AI, full screening battery and the Admin Console; a nurse referral saves; a new patient appears without switching tabs.
