# Retained Encrypted Audio + FHIR R4 Persistence (scoped, low-risk)

## Straight advice first

Two of your JREC assertions cannot be made true cheaply this week, and one can.

1. **AWS S3 in af-south-1 (Cape Town), independent of the app database** — not feasible without delay. It needs an AWS account, an S3 bucket, IAM credentials, CORS config, and a connector wired into the backend. That is external setup you must do, not something I can complete for you. Cost is small; the calendar risk is not.
2. **Retained encrypted audio with PI / Safety-Monitor-only access** — feasible today using the built-in backend's private storage (encrypted at rest, TLS in transit), with access locked to two new roles. This changes *where* audio lives, not *whether* it is protected.
3. **Real FHIR R4 persistence** — feasible today as an additive resource store written alongside the existing tables. Nothing existing is migrated or removed, so nothing breaks.

Recommendation: build 2 and 3 now, and change the JREC wording on 1 from "AWS S3 af-south-1" to the actual platform storage. Trying to make the AWS claim literally true this week is the only part that risks your testing window.

## What gets built

### A. Retained encrypted audio
- Private storage bucket `clinical-audio` (no public URLs; encrypted at rest, TLS 1.3 in transit).
- Recorder uploads the finished recording after transcription, at path `patient/<patient_id>/<session_id>/<timestamp>.webm`.
- New table `audio_recordings`: links the stored file to patient, session, uploader, duration, size, checksum, and retention date.
- Access rules: only users holding the new `safety_monitor` or `principal_investigator` role can list, read, or download audio. Clinicians and CHWs can upload during their own session but cannot read any audio back — including their own. Nobody can delete; removal is retention-driven only.
- Every read of an audio file writes an `audit_events` row (actor, file, time). This is the evidence trail JREC will ask for.
- Consent gate: upload only happens where a recording consent record exists for that patient; otherwise the current behaviour (transcribe and discard) is kept unchanged.
- A "retain audio" toggle defaults **off** for CHW sessions and can be turned on per study arm, so the current flow is unaffected until you switch it on.

### B. Real FHIR R4 persistence
- New table `fhir_resources` holding one JSON document per resource: `resource_type`, `resource_id`, `patient_id`, `version`, `resource` (the FHIR JSON), `created_by`, `created_at`. Rows are append-only and versioned — no in-place edits, which is what makes it audit-defensible.
- The existing `src/lib/fhir/sandbox.ts` mappers get promoted from demo to production and extended to cover: `Patient`, `Encounter`, `Observation` (PHQ-9 and other screeners), `DiagnosticReport`, `CarePlan`, `RiskAssessment`, `Practitioner`, `AuditEvent`.
- Writes happen **in addition to** the current relational writes, at the moments clinical work is signed off: screening completion, session completion, diagnostic approval, treatment plan approval, crisis event. The app continues to read from the relational tables, so no UI or query changes are needed.
- A read-only "FHIR export" view lets you download a patient's full FHIR Bundle — the artefact reviewers usually want to see.

### C. Roles
- Add `safety_monitor` and `principal_investigator` to the role enum, grantable from the existing Admin Console. Your account gets `principal_investigator`.

## What I will NOT touch
- Existing tables, existing RLS, existing Edge Functions' AI behaviour, the CHW and clinician flows, the self-assessment flow. All additive.

## Corrected JREC wording to use
- Audio: "Audio recordings are retained in a private, access-controlled object store operated by the Lovable Cloud backend, encrypted at rest (AES-256) and in transit (TLS 1.3). Read access is restricted by role to the Principal Investigator and Safety Monitor, and every access is logged to an immutable audit trail."
- Structured data: keep your AES-256-GCM / TLS 1.3 / SOC 2 Type 2 / ISO 27001 lines; change "FHIR R4 format" to "relational store with a parallel append-only FHIR R4 resource repository and FHIR R4 Bundle export."
- Sub-processors: remove Vercel and AWS S3; add Google (Gemini, via the Lovable AI Gateway) for narrative processing and transcription, and Twilio for SMS reminders. State the region for each honestly rather than asserting Africa residency for AI inference.
- Budget: reallocate the AWS S3 line to AI inference credits.

## Technical notes
- Migrations: `audio_recordings`, `fhir_resources`, two new enum values, storage RLS policies on the audio bucket, grants on both new tables.
- Files touched: `src/hooks/useAudioRecorder.tsx` and `src/components/InputZone.tsx` (upload hook), `src/lib/fhir/sandbox.ts` → `src/lib/fhir/resources.ts` (mappers), a new `src/lib/fhir/persist.ts` (write-through helper), `src/components/chw/CHWSessionWorkspace.tsx` and the screening/diagnosis/treatment components (call the write-through helper on sign-off), `src/pages/AdminDashboard.tsx` (role grants + audio access panel), `src/lib/permissions.ts`.
- Effort: one build pass. Credit cost is modest — no new AI calls are introduced; this is schema, storage, and mapping work.

## Confirm before I build
- Retain audio **off by default**, switched on per study arm (my recommendation), or on for every session?
