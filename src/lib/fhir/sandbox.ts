// Client-side FHIR R4 example generator for partner integration testing.
// Pure deterministic mapping from sample clinical narratives → FHIR resources.
// No PII; clinician-defined identifiers only.

export interface SampleNarrative {
  id: string;
  title: string;
  language: string;
  setting: string;
  narrative: string;
  mse: {
    appearance: string;
    mood: string;
    affect: string;
    thought: string;
    cognition: string;
    insight: string;
    risk: string;
  };
  phq9: number;        // 0-27
  gad7: number;        // 0-21
  diagnosis: { code: string; system: "icd-10" | "icd-11" | "dsm-5"; display: string };
  crisis: boolean;
}

export const SAMPLE_NARRATIVES: SampleNarrative[] = [
  {
    id: "case-001",
    title: "Adult depressive episode (Shona/English)",
    language: "sn-ZW",
    setting: "Rural clinic, CHW intake → nurse review",
    narrative:
      "32-year-old woman presenting with 6 weeks of low mood, anhedonia, early-morning waking, " +
      "and feelings of worthlessness following loss of employment. Reports 'kufungisisa' (excessive " +
      "thinking). No active suicidal ideation. Functioning impaired at home.",
    mse: {
      appearance: "Tidy, eye contact reduced, psychomotor slowing",
      mood: "Low, subjective '3/10'",
      affect: "Restricted, congruent",
      thought: "Linear; ruminative content; no SI/HI",
      cognition: "Alert, oriented x3",
      insight: "Fair",
      risk: "Low — passive hopelessness only",
    },
    phq9: 17,
    gad7: 11,
    diagnosis: { code: "F32.1", system: "icd-10", display: "Moderate depressive episode" },
    crisis: false,
  },
  {
    id: "case-002",
    title: "Crisis: active suicidal ideation",
    language: "en-ZW",
    setting: "Urban OPD, walk-in",
    narrative:
      "28-year-old man, recent relationship breakdown, presents with active suicidal ideation, " +
      "plan (overdose), access to means. Reports insomnia x2 weeks, hopelessness, withdrawal from " +
      "family. PHQ-9 Item 9 = 3.",
    mse: {
      appearance: "Disheveled, tearful",
      mood: "Severely depressed",
      affect: "Constricted, tearful",
      thought: "Active SI with plan and means; hopelessness",
      cognition: "Alert, oriented",
      insight: "Limited",
      risk: "HIGH — immediate safety planning indicated",
    },
    phq9: 24,
    gad7: 16,
    diagnosis: { code: "F32.2", system: "icd-10", display: "Severe depressive episode without psychotic symptoms" },
    crisis: true,
  },
  {
    id: "case-003",
    title: "Post-trauma presentation (Ndebele)",
    language: "nd-ZW",
    setting: "Community health worker home visit",
    narrative:
      "45-year-old man, survivor of road-traffic accident 4 months ago. Re-experiencing symptoms, " +
      "nightmares, hypervigilance, avoidance of driving. Functional decline at work.",
    mse: {
      appearance: "Anxious, scanning environment",
      mood: "Anxious",
      affect: "Anxious, reactive",
      thought: "Intrusive trauma recollections; no SI",
      cognition: "Alert; concentration impaired",
      insight: "Good",
      risk: "Low",
    },
    phq9: 9,
    gad7: 14,
    diagnosis: { code: "F43.1", system: "icd-10", display: "Post-traumatic stress disorder" },
    crisis: false,
  },
];

const ISO = () => new Date().toISOString();

export function buildBundle(
  s: SampleNarrative,
  opts: { facilityRef?: string; practitionerRef?: string } = {}
) {
  const patientId = `pat-${s.id}`;
  const encounterId = `enc-${s.id}`;
  const practitionerRef = opts.practitionerRef || "Practitioner/example-clinician";
  const facilityRef = opts.facilityRef || "Organization/example-facility";
  const now = ISO();

  const patient = {
    resourceType: "Patient",
    id: patientId,
    meta: { profile: ["http://hl7.org/fhir/StructureDefinition/Patient"], lastUpdated: now },
    identifier: [
      {
        system: "urn:nzwisiso:clinician-defined-id",
        value: s.id.toUpperCase(),
        type: { text: "Clinician-defined reference (no PII)" },
      },
    ],
    active: true,
    gender: "unknown",
    extension: [
      { url: "urn:nzwisiso:language", valueCode: s.language },
      { url: "urn:nzwisiso:setting", valueString: s.setting },
    ],
  };

  const encounter = {
    resourceType: "Encounter",
    id: encounterId,
    status: "finished",
    class: { system: "http://terminology.hl7.org/CodeSystem/v3-ActCode", code: "AMB", display: "ambulatory" },
    subject: { reference: `Patient/${patientId}` },
    participant: [{ individual: { reference: practitionerRef } }],
    serviceProvider: { reference: facilityRef },
    period: { start: now, end: now },
    reasonCode: [{ text: s.title }],
  };

  const obsMSE = {
    resourceType: "Observation",
    id: `obs-mse-${s.id}`,
    status: "final",
    category: [{
      coding: [{ system: "http://terminology.hl7.org/CodeSystem/observation-category", code: "exam", display: "Exam" }],
    }],
    code: { coding: [{ system: "http://loinc.org", code: "10190-7", display: "Mental status" }] },
    subject: { reference: `Patient/${patientId}` },
    encounter: { reference: `Encounter/${encounterId}` },
    effectiveDateTime: now,
    component: Object.entries(s.mse).map(([k, v]) => ({
      code: { text: `MSE.${k}` },
      valueString: v,
    })),
  };

  const obsPHQ9 = {
    resourceType: "Observation",
    id: `obs-phq9-${s.id}`,
    status: "final",
    category: [{
      coding: [{ system: "http://terminology.hl7.org/CodeSystem/observation-category", code: "survey", display: "Survey" }],
    }],
    code: { coding: [{ system: "http://loinc.org", code: "44261-6", display: "PHQ-9 total score" }] },
    subject: { reference: `Patient/${patientId}` },
    encounter: { reference: `Encounter/${encounterId}` },
    effectiveDateTime: now,
    valueQuantity: { value: s.phq9, unit: "{score}", system: "http://unitsofmeasure.org", code: "{score}" },
  };

  const obsGAD7 = {
    resourceType: "Observation",
    id: `obs-gad7-${s.id}`,
    status: "final",
    category: [{
      coding: [{ system: "http://terminology.hl7.org/CodeSystem/observation-category", code: "survey", display: "Survey" }],
    }],
    code: { coding: [{ system: "http://loinc.org", code: "70274-6", display: "GAD-7 total score" }] },
    subject: { reference: `Patient/${patientId}` },
    encounter: { reference: `Encounter/${encounterId}` },
    effectiveDateTime: now,
    valueQuantity: { value: s.gad7, unit: "{score}", system: "http://unitsofmeasure.org", code: "{score}" },
  };

  const diagSystemUrl =
    s.diagnosis.system === "icd-10" ? "http://hl7.org/fhir/sid/icd-10"
    : s.diagnosis.system === "icd-11" ? "http://id.who.int/icd/release/11/mms"
    : "http://www.psychiatry.org/dsm5";

  const diagnostic = {
    resourceType: "DiagnosticReport",
    id: `dr-${s.id}`,
    status: "preliminary",
    category: [{
      coding: [{ system: "http://terminology.hl7.org/CodeSystem/v2-0074", code: "PSY", display: "Psychiatry" }],
    }],
    code: { coding: [{ system: diagSystemUrl, code: s.diagnosis.code, display: s.diagnosis.display }] },
    subject: { reference: `Patient/${patientId}` },
    encounter: { reference: `Encounter/${encounterId}` },
    effectiveDateTime: now,
    issued: now,
    performer: [{ reference: practitionerRef }],
    conclusion:
      "AI-generated suggestion requiring clinical review. " +
      "Awaiting clinician approval before finalisation.",
  };

  const risk = {
    resourceType: "RiskAssessment",
    id: `risk-${s.id}`,
    status: "final",
    subject: { reference: `Patient/${patientId}` },
    encounter: { reference: `Encounter/${encounterId}` },
    occurrenceDateTime: now,
    prediction: [{
      outcome: { text: s.crisis ? "Suicide risk — immediate intervention" : "Low acute risk" },
      qualitativeRisk: {
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/risk-probability",
          code: s.crisis ? "high" : "low",
        }],
      },
    }],
    note: [{ text: s.mse.risk }],
  };

  const composition = {
    resourceType: "Composition",
    id: `comp-${s.id}`,
    status: "preliminary",
    type: { coding: [{ system: "http://loinc.org", code: "11488-4", display: "Consultation note" }] },
    subject: { reference: `Patient/${patientId}` },
    encounter: { reference: `Encounter/${encounterId}` },
    date: now,
    author: [{ reference: practitionerRef }],
    title: `Nzwisiso case summary: ${s.title}`,
    section: [
      { title: "Narrative", text: { status: "additional", div: `<div xmlns="http://www.w3.org/1999/xhtml">${s.narrative}</div>` } },
      { title: "Mental Status Examination", entry: [{ reference: `Observation/${obsMSE.id}` }] },
      { title: "Screening", entry: [{ reference: `Observation/${obsPHQ9.id}` }, { reference: `Observation/${obsGAD7.id}` }] },
      { title: "Diagnostic Suggestion (AI — pending clinician approval)", entry: [{ reference: `DiagnosticReport/${diagnostic.id}` }] },
      { title: "Risk Assessment", entry: [{ reference: `RiskAssessment/${risk.id}` }] },
    ],
  };

  const audit = {
    resourceType: "AuditEvent",
    id: `audit-${s.id}`,
    type: { system: "http://dicom.nema.org/resources/ontology/DCM", code: "110100", display: "Application Activity" },
    action: "C",
    recorded: now,
    outcome: "0",
    agent: [{
      who: { reference: practitionerRef },
      requestor: false,
      type: { text: "AI suggestion generator (Nzwisiso)" },
    }],
    source: { observer: { display: "Nzwisiso FHIR Sandbox" } },
    entity: [{ what: { reference: `Composition/${composition.id}` }, description: "AI-generated, awaiting clinician sign-off" }],
  };

  const bundle = {
    resourceType: "Bundle",
    id: `bundle-${s.id}`,
    type: "collection",
    timestamp: now,
    entry: [patient, encounter, obsMSE, obsPHQ9, obsGAD7, diagnostic, risk, composition, audit].map((r: any) => ({
      fullUrl: `urn:uuid:${r.resourceType}-${r.id}`,
      resource: r,
    })),
  };

  return { bundle, patient, encounter, observations: [obsMSE, obsPHQ9, obsGAD7], diagnostic, risk, composition, audit };
}
