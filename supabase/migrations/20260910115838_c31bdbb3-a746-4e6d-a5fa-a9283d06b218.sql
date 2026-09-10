
-- 1. AI inference ledger
CREATE TABLE public.ai_inference_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name TEXT NOT NULL,
  actor_id UUID,
  actor_role TEXT,
  patient_id UUID,
  model_id TEXT,
  model_version TEXT,
  prompt_template_id UUID,
  input_chars INTEGER NOT NULL DEFAULT 0,
  injection_detected BOOLEAN NOT NULL DEFAULT false,
  injection_patterns JSONB NOT NULL DEFAULT '[]'::jsonb,
  input_rejected BOOLEAN NOT NULL DEFAULT false,
  schema_valid BOOLEAN,
  validation_errors JSONB,
  retried BOOLEAN NOT NULL DEFAULT false,
  dosage_blocked BOOLEAN NOT NULL DEFAULT false,
  latency_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ai_inference_events TO authenticated;
GRANT ALL ON public.ai_inference_events TO service_role;
ALTER TABLE public.ai_inference_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Oversight roles can read inference events"
ON public.ai_inference_events FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'safety_monitor')
  OR public.has_role(auth.uid(), 'principal_investigator')
);

CREATE INDEX idx_ai_inference_events_created ON public.ai_inference_events (created_at DESC);
CREATE INDEX idx_ai_inference_events_function ON public.ai_inference_events (function_name);

-- 2. AI incident register
CREATE TABLE public.ai_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reported_by UUID,
  reporter_role TEXT,
  incident_type TEXT NOT NULL CHECK (incident_type IN (
    'hallucination','wrong_formulation','missed_crisis_cue','injection_attempt',
    'output_validation_failure','unsafe_content','other'
  )),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  description TEXT NOT NULL,
  source_function TEXT,
  linked_ai_output_id UUID,
  linked_patient_id UUID,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','under_review','capa','closed')),
  capa_notes TEXT,
  reviewer_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ
);

GRANT SELECT, INSERT, UPDATE ON public.ai_incidents TO authenticated;
GRANT ALL ON public.ai_incidents TO service_role;
ALTER TABLE public.ai_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can report incidents"
ON public.ai_incidents FOR INSERT TO authenticated
WITH CHECK (reported_by = auth.uid());

CREATE POLICY "Reporters and oversight can read incidents"
ON public.ai_incidents FOR SELECT TO authenticated
USING (
  reported_by = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'safety_monitor')
  OR public.has_role(auth.uid(), 'principal_investigator')
);

CREATE POLICY "Oversight can update incidents"
ON public.ai_incidents FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'safety_monitor')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'safety_monitor')
);

CREATE TRIGGER update_ai_incidents_updated_at
BEFORE UPDATE ON public.ai_incidents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_ai_incidents_status ON public.ai_incidents (status, created_at DESC);

-- 3. Rate limiting
CREATE TABLE public.rate_limit_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL UNIQUE,
  max_requests INTEGER NOT NULL DEFAULT 10,
  window_seconds INTEGER NOT NULL DEFAULT 3600,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.rate_limit_policies TO authenticated;
GRANT ALL ON public.rate_limit_policies TO service_role;
ALTER TABLE public.rate_limit_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read rate limit policies"
ON public.rate_limit_policies FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_rate_limit_policies_updated_at
BEFORE UPDATE ON public.rate_limit_policies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.rate_limit_policies (endpoint, max_requests, window_seconds) VALUES
  ('self-assess', 5, 3600),
  ('validate-intake-token', 10, 3600);

CREATE TABLE public.rate_limit_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL,
  subject_hash TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (endpoint, subject_hash, window_start)
);

GRANT ALL ON public.rate_limit_counters TO service_role;
ALTER TABLE public.rate_limit_counters ENABLE ROW LEVEL SECURITY;

-- 4. Audit vocabulary
ALTER TABLE public.audit_events DROP CONSTRAINT IF EXISTS audit_events_action_check;
ALTER TABLE public.audit_events ADD CONSTRAINT audit_events_action_check CHECK (action = ANY (ARRAY[
  'create','read','update','delete','execute','ai_output_generated','output_approved','output_rejected',
  'crisis_acknowledged','narrative_submitted','document_uploaded','login','logout',
  'pilot_demo_seed','pilot_demo_reset','pilot_config_update','reminder_suppressed_pilot',
  'model_eval_run','model_promoted','model_retired','prompt_updated','safety_preamble_updated',
  'drift_check_run','ai_output_overridden',
  'injection_pattern_detected','output_validation_failed','dosage_pattern_blocked',
  'rate_limit_exceeded','ai_incident_reported','ai_incident_updated'
]));

ALTER TABLE public.audit_events DROP CONSTRAINT IF EXISTS audit_events_resource_type_check;
ALTER TABLE public.audit_events ADD CONSTRAINT audit_events_resource_type_check CHECK (resource_type = ANY (ARRAY[
  'Patient','Encounter','Observation','DiagnosticReport','CarePlan','RiskAssessment','Composition',
  'Practitioner','AuditEvent','Appointment','IdiomSubmission','Document','Session','PilotConfig',
  'ModelVersion','PromptTemplate','SafetyPreamble','EvalRun','DriftMetric',
  'InferenceEvent','AIIncident','RateLimit'
]));
