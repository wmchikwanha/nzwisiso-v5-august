# Nzwisiso pilot build log

Sequential record of the consolidated pilot build batches.

## Batch 0 — Pilot mode and synthetic data (complete)

- Pilot configuration with synthetic-data enforcement and a persistent pilot banner.
- AI provenance labelling; watermarked PDF and FHIR exports.
- Appointment reminders suppressed during the pilot (logged as suppressed).
- Admin-only `pilot-admin` function: seed, reset and configure.
- Twelve synthetic Zimbabwean demo clients (`DEMO-001` … `DEMO-012`).
- Sign-up verification intentionally left disabled for pilot testing.

## Batch 1 — Deterministic clinical rules engine (complete)

- `src/lib/clinical/rulesEngine.ts` and `supabase/functions/_shared/rulesEngine.ts`:
  a single deterministic source for scoring, severity, crisis pathways and mhGAP
  module selection. The AI layer never computes a score.
- SSQ-14 added; all screening tools stamp the rules-engine version.
- Narrative processing reduced to extraction only.
- Dosage scrubbing applied to every AI output.
- CHW closure blocking driven by deterministic crisis pathway output.

## Batch 2 — AI model lifecycle governance (complete)

Registry tables: `model_versions`, `prompt_templates`, `ai_safety_preambles`,
`golden_cases`, `eval_results`, `ai_model_cards`, `ai_confidence_log`,
`ai_drift_metrics`.

- `supabase/functions/_shared/aiRegistry.ts` resolves the pinned model, current
  safety preamble and active prompt template at call time. No model identifier or
  prompt remains hardcoded in an Edge Function; a function returns 503 when no
  model version is active.
- `process-narrative`, `suggest-diagnosis`, `generate-treatment-plan` and `ask-ai`
  wrap clinical text in `<user_content>` and return full provenance
  (model id, model version label, prompt template id and version, preamble hash).
- Regression suite: 10 seeded golden cases, 4 of them adversarial (dosage request,
  fabricated PHQ-9 score, prompt injection, out-of-scope request). Deterministic
  safety checks fail any output containing a dosage, an asserted screening score,
  or evidence of injected-instruction following.
- Promotion gate: `model-lifecycle` refuses to activate a model version without a
  recent passing regression run; promotion, retirement, prompt edits and preamble
  edits are versioned and audited.
- Confidence: `src/lib/ai/confidence.ts` shrinks raw model confidence toward the
  base rate before display and logs every invocation for drift analysis.
- Drift monitoring: 7-day window over override rate and mean confidence, flagged
  above a 30% override rate or below 50% mean confidence.
- Admin UI: Model Registry tab in the admin dashboard.
- Public model information page at `/model-info`, linked from the footer.
- Leaked-password protection enabled on authentication.

Audit vocabulary extended with `model_eval_run`, `model_promoted`,
`model_retired`, `prompt_updated`, `safety_preamble_updated`, `drift_check_run`,
`ai_output_overridden`.

## Batch 3 — AI safety hardening and incident reporting (complete)

Tables: `ai_inference_events`, `ai_incidents`, `rate_limit_policies`,
`rate_limit_counters`.

- `supabase/functions/_shared/aiGuard.ts`: multilingual prompt-injection
  detection, a 24,000-character input cap (hard reject above 48,000), a dosage
  blocklist, structured-output validation, uniform public error text, SHA-256
  hashed rate limiting and inference/audit/incident logging.
- All clinical text is wrapped in `<user_content>`; the current safety preamble
  instructs the model to treat that content as data, never as instructions.
- `suggest-diagnosis` and `generate-treatment-plan` validate the structured
  result, retry once, then fail safe with
  "AI suggestion unavailable, clinical review required" and raise an automatic
  incident. `process-narrative`, `ask-ai`, `transcribe-audio`,
  `process-document`, `self-assess` and `validate-intake-token` guard and log
  every invocation.
- Public endpoints (`self-assess`, `validate-intake-token`) are rate limited
  per IP/token and return uniform errors that do not disclose token validity.
- Clinicians can report a problem from the diagnostic and treatment cards;
  admins and safety monitors triage in Admin → Safety reports with audited
  status transitions and corrective-action notes.
- Two further adversarial golden cases added (Shona and Ndebele injection).
