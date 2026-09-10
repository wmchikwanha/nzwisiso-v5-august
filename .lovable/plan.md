# Batch 0 — Pilot guardrails and synthetic-data safety

First step of the consolidated build sequence. Goal: make it unmistakable, everywhere in the app and on every document it produces, that this is a pilot running on made-up data — and put the record-keeping fields in place that later batches depend on.

## What you will see

- A slim bar on every screen that cannot be dismissed: "PILOT DEMO — SYNTHETIC DATA ONLY — NOT FOR CLINICAL USE".
- Every record created while pilot mode is on is marked as demo data automatically, without anyone having to tick a box.
- Every PDF the app produces (case summary, screening, treatment plan) carries "PILOT — SYNTHETIC DATA — NOT A CLINICAL RECORD" at the top and bottom of each page, and FHIR exports carry the same label.
- Appointment reminder texts are not sent while the pilot is on. Each one that would have gone out is recorded in the activity log instead, so nothing is silently lost.
- In the Admin Console, a new "Pilot" area: an on/off switch for pilot mode, the pilot version and end date, and a "Reset demo data" button.
- Twelve demo clients, DEMO-001 to DEMO-012, with realistic mixed Shona/Ndebele/English narratives across the full PHQ-9 severity range, including one suicidality case and one safeguarding case. No real names, numbers or places anywhere in them.

## Decisions carried in from your answers

- Instant sign-up with no email verification stays as it is. The source document asks for verification to be forced on; we are deliberately deferring that to the final pre-launch step, which the document's own authentication note permits. This will be recorded as a known open item.
- "Reset demo data" only removes the DEMO-nnn clients and everything attached to them, then reseeds. Your own test patients and sessions are never touched.

## Technical section

Migration:
- New `pilot_config` table (single row): `pilot_mode` default true, `allow_real_data` default false, `pilot_version`, `pilot_end_date`. Readable by any signed-in user; writable by admin only. GRANTs for authenticated and service_role.
- `synthetic boolean not null default true` added to `patients`, `chw_sessions`, `assessments`, `screening_assessments`, `audio_recordings`, plus a BEFORE INSERT trigger forcing it true whenever `pilot_mode` is true.
- AI provenance columns added where AI output is stored (`assessments`, `diagnostic_formulations`, `treatment_notes`, `self_assessment_sessions`, `patient_intake_sessions`): `ai_generated boolean default false`, `model_id`, `model_version`, `prompt_template_id`, `prompt_template_version`, `provenance jsonb`. Populated by the edge functions in a later batch; columns land now so nothing has to be re-migrated.
- `created_by` added where missing on the tables above.

Frontend:
- `src/hooks/usePilotConfig.tsx` — fetches and caches the config row; `src/components/PilotBanner.tsx` rendered in `App.tsx` above the router outlet so it appears on public routes too (`/self-assess`, `/intake`) and not just authenticated screens.
- Shared `PILOT_WATERMARK` constant in `src/lib/copy.ts`, applied in `pdfExport.ts`, `caseSummaryPdfExport.ts`, `screeningPdfExport.ts`, `treatmentPlanPdfExport.ts` as a repeated header/footer line on every page, and as a `meta` tag on FHIR bundles from `src/lib/fhir/resources.ts`.
- New `src/components/admin/PilotPanel.tsx` added as a tab in `AdminDashboard.tsx`: toggle pilot mode, edit version/end date, run reset.

Backend:
- `send-appointment-reminder` and `check-upcoming-appointments`: read `pilot_config`; when `pilot_mode` is true, skip the Twilio call and write an `audit_events` row with action `reminder_suppressed_pilot`.
- New `pilot-admin` edge function (admin-verified server-side via `has_role`) with two actions: `reset_demo_data` (deletes only patients whose `patient_identifier` matches `DEMO-%` plus their child rows, reseeds the 12, writes an audit event) and `seed_demo_data`.

Verification before handing back: build clean, banner present on an authenticated screen and on `/self-assess`, reset produces exactly 12 demo clients, a non-demo patient survives a reset, and one generated PDF checked for the watermark.

## Known open item

- Email verification remains disabled for testing (deviates from the document's standing instruction 6). To be re-enabled in the final pre-production batch.
