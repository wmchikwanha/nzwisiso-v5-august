ALTER TABLE public.audit_events DROP CONSTRAINT IF EXISTS audit_events_action_check;
ALTER TABLE public.audit_events ADD CONSTRAINT audit_events_action_check CHECK (action = ANY (ARRAY[
  'create','read','update','delete','execute','ai_output_generated','output_approved','output_rejected',
  'crisis_acknowledged','narrative_submitted','document_uploaded','login','logout',
  'pilot_demo_seed','pilot_demo_reset','pilot_config_update','reminder_suppressed_pilot',
  'model_eval_run','model_promoted','model_retired','prompt_updated','safety_preamble_updated',
  'drift_check_run','ai_output_overridden'
]));

ALTER TABLE public.audit_events DROP CONSTRAINT IF EXISTS audit_events_resource_type_check;
ALTER TABLE public.audit_events ADD CONSTRAINT audit_events_resource_type_check CHECK (resource_type = ANY (ARRAY[
  'Patient','Encounter','Observation','DiagnosticReport','CarePlan','RiskAssessment','Composition',
  'Practitioner','AuditEvent','Appointment','IdiomSubmission','Document','Session','PilotConfig',
  'ModelVersion','PromptTemplate','SafetyPreamble','EvalRun','DriftMetric'
]));