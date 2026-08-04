// Append-only FHIR R4 write-through layer.
//
// Every clinical sign-off writes FHIR documents *alongside* the existing
// relational rows. The app still reads from the relational tables — this
// repository exists for interoperability, export, and audit defensibility.
//
// Rows are never updated or deleted; a re-write of the same resource id
// creates version N+1.

import { supabase } from "@/integrations/supabase/client";
import {
  type FhirResource,
  bundleOf,
  patientResource,
  practitionerResource,
  encounterResource,
  screeningObservation,
  mseObservation,
  diagnosticReportResource,
  carePlanResource,
  riskAssessmentResource,
  auditEventResource,
} from "./resources";

interface PersistContext {
  patientId?: string | null;
  sourceTable?: string;
  sourceId?: string | null;
}

async function nextVersion(resourceType: string, resourceId: string): Promise<number> {
  const { data } = await supabase
    .from("fhir_resources")
    .select("version")
    .eq("resource_type", resourceType)
    .eq("resource_id", resourceId)
    .order("version", { ascending: false })
    .limit(1);
  return data && data.length > 0 ? (data[0].version as number) + 1 : 1;
}

/** Persist a set of FHIR resources. Failures are logged, never thrown at the UI. */
export async function persistFhir(
  resources: FhirResource[],
  ctx: PersistContext = {},
): Promise<number> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id;
    if (!userId || resources.length === 0) return 0;

    const rows = [];
    for (const r of resources) {
      if (!r?.resourceType || !r?.id) continue;
      rows.push({
        resource_type: r.resourceType,
        resource_id: String(r.id),
        version: await nextVersion(r.resourceType, String(r.id)),
        patient_id: ctx.patientId ?? null,
        source_table: ctx.sourceTable ?? null,
        source_id: ctx.sourceId ?? null,
        resource: r as any,
        created_by: userId,
      });
    }
    if (rows.length === 0) return 0;

    const { error } = await supabase.from("fhir_resources").insert(rows);
    if (error) {
      console.error("FHIR persistence failed:", error.message);
      return 0;
    }
    return rows.length;
  } catch (e) {
    console.error("FHIR persistence error:", e);
    return 0;
  }
}

// ---------------------------------------------------------------------------
// Sign-off hooks
// ---------------------------------------------------------------------------

export async function persistScreeningFhir(row: {
  id: string;
  patient_id: string;
  user_id: string;
  tool_type: string;
  total_score: number;
  severity_level?: string | null;
  interpretation?: string | null;
  administered_at: string;
}): Promise<void> {
  const obs = screeningObservation({
    id: row.id,
    patientId: row.patient_id,
    toolType: row.tool_type,
    totalScore: row.total_score,
    severity: row.severity_level,
    interpretation: row.interpretation,
    administeredAt: row.administered_at,
  });
  await persistFhir([obs], {
    patientId: row.patient_id,
    sourceTable: "screening_assessments",
    sourceId: row.id,
  });
}

export async function persistChwSessionFhir(args: {
  session: {
    id: string;
    patient_id: string;
    chw_id: string;
    status: string;
    started_at: string;
    ended_at?: string | null;
    session_number: number;
    narrative_text?: string | null;
    phq9_score?: number | null;
    phq9_severity?: string | null;
    phq9_item9_flag?: boolean | null;
  };
  patient?: {
    id: string;
    patient_identifier: string;
    gender?: string | null;
    date_of_birth?: string | null;
    language_preference?: string | null;
  } | null;
  practitionerName?: string | null;
}): Promise<void> {
  const s = args.session;
  const resources: FhirResource[] = [];

  if (args.patient) resources.push(patientResource(args.patient));
  resources.push(
    practitionerResource({ id: s.chw_id, full_name: args.practitionerName, role: "chw" }),
  );
  resources.push(
    encounterResource({
      id: s.id,
      patientId: s.patient_id,
      practitionerId: s.chw_id,
      start: s.started_at,
      end: s.ended_at,
      status: s.status,
      reason: `CHW session #${s.session_number}`,
      setting: "Community health worker encounter",
    }),
  );

  if (s.narrative_text) {
    resources.push(
      mseObservation({
        id: `narrative-${s.id}`,
        patientId: s.patient_id,
        encounterId: s.id,
        mse: { narrative: s.narrative_text },
        effective: s.ended_at || s.started_at,
      }),
    );
  }

  if (s.phq9_score != null) {
    resources.push(
      screeningObservation({
        id: `phq9-${s.id}`,
        patientId: s.patient_id,
        encounterId: s.id,
        toolType: "PHQ9",
        totalScore: s.phq9_score,
        severity: s.phq9_severity,
        administeredAt: s.ended_at || s.started_at,
      }),
    );
    resources.push(
      riskAssessmentResource({
        id: `risk-${s.id}`,
        patientId: s.patient_id,
        encounterId: s.id,
        practitionerId: s.chw_id,
        high: !!s.phq9_item9_flag,
        outcomeText: s.phq9_item9_flag
          ? "Suicidality endorsed (PHQ-9 item 9) — emergency referral required"
          : "No suicidality endorsed on PHQ-9 item 9",
      }),
    );
  }

  resources.push(
    auditEventResource({
      id: `audit-${s.id}-${Date.now()}`,
      action: "C",
      actorId: s.chw_id,
      actorRole: "chw",
      description: `CHW session #${s.session_number} signed off (${s.status})`,
      entityRef: `Encounter/${s.id}`,
    }),
  );

  await persistFhir(resources, {
    patientId: s.patient_id,
    sourceTable: "chw_sessions",
    sourceId: s.id,
  });
}

export async function persistDiagnosticFhir(row: {
  id: string;
  patient_id: string;
  user_id: string;
  primary_diagnosis_code: string;
  primary_diagnosis_name: string;
  diagnostic_framework: string;
  status?: string | null;
  diagnostic_reasoning?: string | null;
  differential_diagnoses?: unknown;
  formulated_at?: string | null;
}): Promise<void> {
  const dr = diagnosticReportResource({
    id: row.id,
    patientId: row.patient_id,
    practitionerId: row.user_id,
    code: row.primary_diagnosis_code,
    display: row.primary_diagnosis_name,
    framework: row.diagnostic_framework,
    approved: (row.status || "").toLowerCase() === "approved",
    reasoning: row.diagnostic_reasoning,
    differentials: row.differential_diagnoses,
    effective: row.formulated_at || undefined,
  });
  await persistFhir([dr], {
    patientId: row.patient_id,
    sourceTable: "diagnostic_formulations",
    sourceId: row.id,
  });
}

export async function persistTreatmentPlanFhir(args: {
  id: string;
  patientId: string;
  practitionerId: string;
  title: string;
  activities: string[];
  approved: boolean;
  note?: string | null;
}): Promise<void> {
  const plan = carePlanResource({
    id: args.id,
    patientId: args.patientId,
    practitionerId: args.practitionerId,
    approved: args.approved,
    title: args.title,
    activities: args.activities,
    note: args.note,
  });
  await persistFhir([plan], {
    patientId: args.patientId,
    sourceTable: "treatment_notes",
    sourceId: args.id,
  });
}

export async function persistCrisisFhir(row: {
  id: string;
  patient_id: string;
  user_id: string;
  crisis_type: string;
  severity_level: string;
  outcome?: string | null;
  crisis_started_at?: string | null;
}): Promise<void> {
  const risk = riskAssessmentResource({
    id: row.id,
    patientId: row.patient_id,
    practitionerId: row.user_id,
    high: ["high", "severe", "critical"].includes((row.severity_level || "").toLowerCase()),
    outcomeText: `${row.crisis_type} — ${row.severity_level}`,
    note: row.outcome,
    occurrence: row.crisis_started_at || undefined,
  });
  await persistFhir([risk], {
    patientId: row.patient_id,
    sourceTable: "crisis_interventions",
    sourceId: row.id,
  });
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

/** Latest version of every FHIR resource for a patient, as a FHIR Bundle. */
export async function exportPatientBundle(patientId: string): Promise<FhirResource | null> {
  const { data, error } = await supabase
    .from("fhir_resources")
    .select("resource_type, resource_id, version, resource")
    .eq("patient_id", patientId)
    .order("version", { ascending: true });

  if (error) {
    console.error("FHIR export failed:", error.message);
    return null;
  }
  if (!data || data.length === 0) return bundleOf([], `bundle-${patientId}`);

  const latest = new Map<string, FhirResource>();
  for (const row of data) {
    latest.set(`${row.resource_type}/${row.resource_id}`, row.resource as FhirResource);
  }
  return bundleOf(Array.from(latest.values()), `bundle-${patientId}`);
}

export function downloadBundle(bundle: FhirResource, filename = "fhir-bundle.json") {
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/fhir+json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
