// Production FHIR R4 mappers.
//
// Maps live Nzwisiso relational records → FHIR R4 resources. These are the
// same shapes as the sandbox generator, but driven by real rows rather than
// sample narratives. Output is persisted append-only via ./persist.
//
// No PII: Patient carries a clinician-defined identifier only.

const ISO = () => new Date().toISOString();

export type FhirResource = Record<string, any>;

const SCREENING_LOINC: Record<string, { code: string; display: string }> = {
  PHQ9: { code: "44261-6", display: "PHQ-9 total score" },
  GAD7: { code: "70274-6", display: "GAD-7 total score" },
  PCL5: { code: "85033-6", display: "PCL-5 total score" },
  MMSE: { code: "72106-8", display: "MMSE total score" },
  PSQ: { code: "93373-9", display: "Suicide risk screen score" },
  PRIMER5: { code: "89204-2", display: "PRIME screen score" },
};

export function patientResource(p: {
  id: string;
  patient_identifier: string;
  gender?: string | null;
  date_of_birth?: string | null;
  language_preference?: string | null;
}): FhirResource {
  return {
    resourceType: "Patient",
    id: p.id,
    meta: { lastUpdated: ISO() },
    identifier: [
      {
        system: "urn:nzwisiso:clinician-defined-id",
        value: p.patient_identifier,
        type: { text: "Clinician-defined reference (no PII)" },
      },
    ],
    active: true,
    gender: (p.gender || "unknown").toLowerCase(),
    birthDate: p.date_of_birth || undefined,
    communication: p.language_preference
      ? [{ language: { text: p.language_preference } }]
      : undefined,
  };
}

export function practitionerResource(u: { id: string; full_name?: string | null; role?: string | null }): FhirResource {
  return {
    resourceType: "Practitioner",
    id: u.id,
    meta: { lastUpdated: ISO() },
    identifier: [{ system: "urn:nzwisiso:auth-uid", value: u.id }],
    active: true,
    name: u.full_name ? [{ text: u.full_name }] : undefined,
    extension: u.role ? [{ url: "urn:nzwisiso:role", valueCode: u.role }] : undefined,
  };
}

export function encounterResource(e: {
  id: string;
  patientId: string;
  practitionerId: string;
  start: string;
  end?: string | null;
  status?: string;
  reason?: string;
  setting?: string;
}): FhirResource {
  return {
    resourceType: "Encounter",
    id: e.id,
    status: e.status === "active" ? "in-progress" : "finished",
    class: {
      system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
      code: "AMB",
      display: "ambulatory",
    },
    subject: { reference: `Patient/${e.patientId}` },
    participant: [{ individual: { reference: `Practitioner/${e.practitionerId}` } }],
    period: { start: e.start, end: e.end || undefined },
    reasonCode: e.reason ? [{ text: e.reason }] : undefined,
    extension: e.setting ? [{ url: "urn:nzwisiso:setting", valueString: e.setting }] : undefined,
  };
}

export function screeningObservation(o: {
  id: string;
  patientId: string;
  encounterId?: string | null;
  toolType: string;
  totalScore: number;
  severity?: string | null;
  interpretation?: string | null;
  administeredAt: string;
}): FhirResource {
  const loinc = SCREENING_LOINC[(o.toolType || "").toUpperCase()] ?? {
    code: "72133-2",
    display: `${o.toolType} score`,
  };
  return {
    resourceType: "Observation",
    id: o.id,
    status: "final",
    category: [
      {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/observation-category",
            code: "survey",
            display: "Survey",
          },
        ],
      },
    ],
    code: { coding: [{ system: "http://loinc.org", ...loinc }] },
    subject: { reference: `Patient/${o.patientId}` },
    encounter: o.encounterId ? { reference: `Encounter/${o.encounterId}` } : undefined,
    effectiveDateTime: o.administeredAt,
    valueQuantity: {
      value: o.totalScore,
      unit: "{score}",
      system: "http://unitsofmeasure.org",
      code: "{score}",
    },
    interpretation: o.severity ? [{ text: o.severity }] : undefined,
    note: o.interpretation ? [{ text: o.interpretation }] : undefined,
  };
}

export function mseObservation(o: {
  id: string;
  patientId: string;
  encounterId?: string | null;
  mse: Record<string, unknown>;
  effective?: string;
}): FhirResource {
  return {
    resourceType: "Observation",
    id: o.id,
    status: "final",
    category: [
      {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/observation-category",
            code: "exam",
            display: "Exam",
          },
        ],
      },
    ],
    code: { coding: [{ system: "http://loinc.org", code: "10190-7", display: "Mental status" }] },
    subject: { reference: `Patient/${o.patientId}` },
    encounter: o.encounterId ? { reference: `Encounter/${o.encounterId}` } : undefined,
    effectiveDateTime: o.effective || ISO(),
    component: Object.entries(o.mse || {})
      .filter(([, v]) => v != null && v !== "")
      .map(([k, v]) => ({
        code: { text: `MSE.${k}` },
        valueString: typeof v === "string" ? v : JSON.stringify(v),
      })),
  };
}

export function diagnosticReportResource(d: {
  id: string;
  patientId: string;
  encounterId?: string | null;
  practitionerId: string;
  code: string;
  display: string;
  framework: string;
  approved: boolean;
  reasoning?: string | null;
  differentials?: unknown;
  effective?: string;
}): FhirResource {
  const fw = (d.framework || "").toLowerCase();
  const system =
    fw.includes("icd-10") ? "http://hl7.org/fhir/sid/icd-10"
    : fw.includes("icd") ? "http://id.who.int/icd/release/11/mms"
    : "http://www.psychiatry.org/dsm5";
  return {
    resourceType: "DiagnosticReport",
    id: d.id,
    status: d.approved ? "final" : "preliminary",
    category: [
      {
        coding: [
          { system: "http://terminology.hl7.org/CodeSystem/v2-0074", code: "PSY", display: "Psychiatry" },
        ],
      },
    ],
    code: { coding: [{ system, code: d.code, display: d.display }] },
    subject: { reference: `Patient/${d.patientId}` },
    encounter: d.encounterId ? { reference: `Encounter/${d.encounterId}` } : undefined,
    performer: [{ reference: `Practitioner/${d.practitionerId}` }],
    effectiveDateTime: d.effective || ISO(),
    issued: ISO(),
    conclusion: d.approved
      ? d.reasoning || "Clinician-approved diagnostic formulation."
      : "AI-generated suggestion requiring clinical review. Awaiting clinician approval before finalisation.",
    extension: d.differentials
      ? [{ url: "urn:nzwisiso:differentials", valueString: JSON.stringify(d.differentials) }]
      : undefined,
  };
}

export function carePlanResource(c: {
  id: string;
  patientId: string;
  encounterId?: string | null;
  practitionerId: string;
  approved: boolean;
  title: string;
  activities: string[];
  note?: string | null;
}): FhirResource {
  return {
    resourceType: "CarePlan",
    id: c.id,
    status: c.approved ? "active" : "draft",
    intent: "plan",
    title: c.title,
    subject: { reference: `Patient/${c.patientId}` },
    encounter: c.encounterId ? { reference: `Encounter/${c.encounterId}` } : undefined,
    author: { reference: `Practitioner/${c.practitionerId}` },
    created: ISO(),
    activity: (c.activities || []).map((a) => ({ detail: { status: "not-started", description: a } })),
    note: [
      { text: "Aligned to WHO mhGAP Intervention Guide v2.0. No medication dosages." },
      ...(c.note ? [{ text: c.note }] : []),
    ],
  };
}

export function riskAssessmentResource(r: {
  id: string;
  patientId: string;
  encounterId?: string | null;
  practitionerId: string;
  high: boolean;
  outcomeText: string;
  note?: string | null;
  occurrence?: string;
}): FhirResource {
  return {
    resourceType: "RiskAssessment",
    id: r.id,
    status: "final",
    subject: { reference: `Patient/${r.patientId}` },
    encounter: r.encounterId ? { reference: `Encounter/${r.encounterId}` } : undefined,
    performer: { reference: `Practitioner/${r.practitionerId}` },
    occurrenceDateTime: r.occurrence || ISO(),
    prediction: [
      {
        outcome: { text: r.outcomeText },
        qualitativeRisk: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/risk-probability",
              code: r.high ? "high" : "low",
            },
          ],
        },
      },
    ],
    note: r.note ? [{ text: r.note }] : undefined,
  };
}

export function auditEventResource(a: {
  id: string;
  action: "C" | "R" | "U" | "D";
  actorId: string;
  actorRole: string;
  description: string;
  entityRef?: string;
  recorded?: string;
}): FhirResource {
  return {
    resourceType: "AuditEvent",
    id: a.id,
    type: {
      system: "http://dicom.nema.org/resources/ontology/DCM",
      code: "110100",
      display: "Application Activity",
    },
    action: a.action,
    recorded: a.recorded || ISO(),
    outcome: "0",
    agent: [
      {
        who: { reference: `Practitioner/${a.actorId}` },
        requestor: true,
        type: { text: a.actorRole },
      },
    ],
    source: { observer: { display: "Nzwisiso" } },
    entity: a.entityRef ? [{ what: { reference: a.entityRef }, description: a.description }] : undefined,
  };
}

export function bundleOf(resources: FhirResource[], id = `bundle-${Date.now()}`): FhirResource {
  const pilot = isPilotModeSync();
  return {
    resourceType: "Bundle",
    id,
    type: "collection",
    timestamp: ISO(),
    meta: pilot
      ? {
          lastUpdated: ISO(),
          tag: [
            {
              system: "http://nzwisiso.app/CodeSystem/data-classification",
              code: "pilot-synthetic",
              display: PILOT_WATERMARK,
            },
          ],
        }
      : { lastUpdated: ISO() },
    entry: resources.map((r) => ({
      fullUrl: `urn:uuid:${r.resourceType}-${r.id}`,
      resource: r,
    })),
  };
}
