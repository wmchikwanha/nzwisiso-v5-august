// FHIR R4 system URI for LOINC — used in Observation.code.coding[].system
export const LOINC_SYSTEM = 'http://loinc.org';

// LOINC codes for each screening instrument
// Used when writing FHIR Observation resources to MongoDB / exporting to EHR
// Panel code  → Observation that groups item-level responses
// Score code  → Observation that records the total score value
// Verify all codes at https://loinc.org/search before production use
export const SCREENING_INSTRUMENTS = {
  PHQ9: {
    id:           'PHQ-9',
    name:         'Patient Health Questionnaire-9',
    loincPanel:   '44249-1',   // PHQ-9 quick depression assessment panel
    loincScore:   '44261-6',   // PHQ-9 total score
    loincItem9:   '44260-8',   // Item 9 — suicidal ideation (triggers crisis protocol)
    maxScore:     27,
  },
  GAD7: {
    id:           'GAD-7',
    name:         'Generalized Anxiety Disorder 7-item scale',
    loincPanel:   '69737-5',   // GAD-7 panel
    loincScore:   '70274-6',   // GAD-7 total score
    maxScore:     21,
  },
  PCL5: {
    id:           'PCL-5',
    name:         'PTSD Checklist for DSM-5',
    loincPanel:   '71969-0',   // PCL-5 with Life Events Checklist panel
    loincScore:   '96843-5',   // PCL-5 total score — verify against LOINC browser
    maxScore:     80,
  },
  MMSE: {
    id:           'MMSE',
    name:         'Mini-Mental State Examination',
    loincPanel:   '72106-8',   // MMSE panel
    loincScore:   '72107-6',   // MMSE total score — verify against LOINC browser
    maxScore:     30,
  },
  PSQ: {
    id:           'PSQ',
    name:         'Psychosis Screening Questionnaire',
    loincPanel:   null,        // No widely-adopted LOINC code — pending LOINC submission
    loincScore:   null,
    maxScore:     6,
  },
  PRIMER5: {
    id:           'PRIME-R-5',
    name:         'PRIME Screen Revised 5-item',
    loincPanel:   null,        // No widely-adopted LOINC code — pending LOINC submission
    loincScore:   null,
    maxScore:     25,
  },
  SSQ14: {
    id:           'SSQ-14',
    name:         'Shona Symptom Questionnaire (14-item)',
    loincPanel:   null,        // Locally validated instrument — no LOINC code
    loincScore:   null,
    maxScore:     14,
  },

} as const;

export type ScreeningInstrumentKey = keyof typeof SCREENING_INSTRUMENTS;

// Build a minimal FHIR R4 Observation for a screening score
// Full Observation (with item-level responses) should be built in the edge function
export function toFHIRScoreObservation(
  instrument: ScreeningInstrumentKey,
  result: { totalScore: number; severityLevel: string },
  patientId: string,
  encounterId: string,
) {
  const tool = SCREENING_INSTRUMENTS[instrument];
  const coding = tool.loincScore
    ? [{ system: LOINC_SYSTEM, code: tool.loincScore, display: `${tool.name} total score` }]
    : [{ system: 'http://nzwisiso.app/fhir/screening', code: tool.id, display: `${tool.name} total score` }];

  return {
    resourceType: 'Observation',
    status: 'preliminary',   // clinician must approve → becomes 'final'
    category: [{
      coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'survey' }],
    }],
    code: { coding, text: `${tool.name} total score` },
    subject:   { reference: `Patient/${patientId}` },
    encounter: { reference: `Encounter/${encounterId}` },
    valueInteger: result.totalScore,
    interpretation: [{
      coding: [{ system: 'http://nzwisiso.app/fhir/severity', code: result.severityLevel }],
      text: result.severityLevel,
    }],
    note: [{ text: 'AI-generated suggestion requiring clinical review' }],
  };
}

// =============================================================================
// PRESENTATION WRAPPERS
// All arithmetic and banding is delegated to the deterministic clinical rules
// engine (src/lib/clinical/rulesEngine.ts). These wrappers only add the
// human-readable labels and interpretation copy used by the UI and PDFs.
// No AI is involved in any scoring path.
// =============================================================================
import * as RE from "@/lib/clinical/rulesEngine";

export { RULES_ENGINE_VERSION, AI_LAYER_LABEL } from "@/lib/clinical/rulesEngine";

export interface ScoringResult {
  totalScore: number;
  severityLevel: string;
  interpretation: string;
  alerts?: string[];
  /** Version of the deterministic rules engine that produced this result. */
  rulesVersion?: string;
}

const withVersion = (r: Omit<ScoringResult, "rulesVersion">): ScoringResult => ({
  ...r,
  rulesVersion: RE.RULES_ENGINE_VERSION,
});

const GAD7_COPY: Record<RE.GAD7Severity, [string, string]> = {
  minimal: ["Minimal", "Minimal anxiety. Continue monitoring."],
  mild: ["Mild", "Mild anxiety. Watchful waiting recommended. Consider lifestyle interventions."],
  moderate: ["Moderate", "Moderate anxiety. Treatment plan recommended. Consider psychotherapy or pharmacotherapy."],
  severe: ["Severe", "Severe anxiety. Active treatment warranted. Recommend psychiatric evaluation and intervention."],
};

export const scoreGAD7 = (responses: number[]): ScoringResult => {
  const { total, severity } = RE.scoreGAD7(responses);
  const [severityLevel, interpretation] = GAD7_COPY[severity];
  return withVersion({ totalScore: total, severityLevel, interpretation });
};

const PHQ9_COPY: Record<RE.PHQ9Severity, [string, string]> = {
  minimal: ["Minimal", "Minimal depression. No treatment required, continue monitoring."],
  mild: ["Mild", "Mild depression. Watchful waiting. Consider psychotherapy if symptoms persist."],
  moderate: ["Moderate", "Moderate depression. Treatment plan recommended. Psychotherapy and/or antidepressant medication."],
  "moderately-severe": ["Moderately Severe", "Moderately severe depression. Active treatment required. Psychotherapy and antidepressant medication recommended."],
  severe: ["Severe", "Severe depression. Immediate intervention required. Consider intensive treatment options and close monitoring."],
};

export const scorePHQ9 = (responses: number[]): ScoringResult => {
  const result = RE.scorePHQ9(responses);
  const [severityLevel, interpretation] = PHQ9_COPY[result.severity];
  const alerts: string[] = [];
  if (result.crisisTriggered) {
    alerts.push(
      "SUICIDALITY ALERT: Patient endorsed thoughts of self-harm or suicide. Immediate safety assessment required.",
    );
  }
  return withVersion({
    totalScore: result.total,
    severityLevel,
    interpretation,
    alerts: alerts.length ? alerts : undefined,
  });
};

export const scorePCL5 = (responses: number[]): ScoringResult => {
  const { total, provisionalPTSD, meetsClusterCriteria } = RE.scorePCL5(responses);
  const alerts: string[] = [];

  let severityLevel: string;
  let interpretation: string;

  if (provisionalPTSD && meetsClusterCriteria) {
    severityLevel = "Provisional PTSD Diagnosis";
    interpretation =
      "Total score ≥33 AND meets DSM-5 symptom cluster criteria. Provisional PTSD diagnosis. Comprehensive psychiatric evaluation recommended.";
    alerts.push("Patient meets provisional criteria for PTSD diagnosis.");
  } else if (provisionalPTSD) {
    severityLevel = "High Symptoms";
    interpretation =
      "High PTSD symptom severity (≥33) but does not meet all DSM-5 cluster criteria. Further assessment recommended.";
  } else if (total >= 21) {
    severityLevel = "Moderate";
    interpretation = "Moderate PTSD symptoms. Consider trauma-focused psychotherapy.";
  } else {
    severityLevel = "Low";
    interpretation = "Low PTSD symptom severity. Continue monitoring if trauma exposure present.";
  }

  return withVersion({
    totalScore: total,
    severityLevel,
    interpretation,
    alerts: alerts.length ? alerts : undefined,
  });
};

const MMSE_COPY: Record<RE.MMSEImpairment, [string, string]> = {
  none: ["Normal", "No cognitive impairment detected. Cognitive functioning within normal limits."],
  mild: ["Mild Impairment", "Mild cognitive impairment. Further neuropsychological assessment recommended. Consider reversible causes."],
  moderate: ["Moderate Impairment", "Moderate cognitive impairment. Neurological evaluation recommended."],
  severe: ["Severe Impairment", "Severe cognitive impairment. Comprehensive neurological evaluation required. Consider dementia workup."],
};

/** MMSE is proprietary — retained for historic records only, deactivated in the battery. */
export const scoreMMSE = (responses: number[]): ScoringResult => {
  const { total, impairment } = RE.scoreMMSE(responses);
  const [severityLevel, interpretation] = MMSE_COPY[impairment];
  return withVersion({ totalScore: total, severityLevel, interpretation });
};

const SSQ14_COPY: Record<RE.SSQ14Severity, [string, string]> = {
  none: ["Below Threshold", "Below the SSQ-14 threshold for common mental disorder. Watchful waiting and psychoeducation."],
  mild: ["Mild Distress", "Mild distress below the validated cut-point (8). Psychoeducation, review in 2–4 weeks."],
  moderate: ["Moderate Distress", "At or above the validated cut-point (≥8) for common mental disorder. Problem-solving therapy indicated; consider referral."],
  severe: ["Severe Distress", "High distress burden (≥11). Structured psychological intervention and clinician review indicated."],
};

export const scoreSSQ14 = (responses: number[]): ScoringResult => {
  const { total, severity, distressFlag } = RE.scoreSSQ14(responses);
  const [severityLevel, interpretation] = SSQ14_COPY[severity];
  const alerts: string[] = [];
  if (distressFlag) {
    alerts.push("SSQ-14 score ≥8 — screens positive for common mental disorder. Clinical review indicated.");
  }
  if (responses[1] >= 1) {
    alerts.push("SUICIDALITY ALERT: Item 2 endorsed (thoughts of ending life). Immediate safety assessment required.");
  }
  return withVersion({
    totalScore: total,
    severityLevel,
    interpretation,
    alerts: alerts.length ? alerts : undefined,
  });
};

export const scorePSQ = (responses: { question: string; endorsed: boolean }[]): ScoringResult => {
  const { total, crisisTriggered } = RE.scorePSQ(responses.map((r) => (r.endorsed ? 1 : 0)));
  const alerts: string[] = [];

  let severityLevel: string;
  let interpretation: string;

  if (total === 0) {
    severityLevel = "Negative Screen";
    interpretation = "No psychotic symptoms endorsed. Negative screen for psychosis.";
  } else if (total === 1) {
    severityLevel = "Positive Screen - Single Item";
    interpretation = "Single positive response. Consider further assessment for psychotic symptoms.";
    alerts.push("Positive screen for psychotic symptoms. Clinical interview recommended.");
  } else {
    severityLevel = "Positive Screen - Multiple Items";
    interpretation = "Multiple positive responses. Urgent psychiatric evaluation for psychosis required.";
    alerts.push("URGENT: Multiple psychotic symptoms endorsed. Immediate psychiatric assessment required.");
  }

  if (crisisTriggered) {
    alerts.push("CRISIS PATHWAY: PSQ total ≥3 — psychotic-agitation pathway triggered deterministically.");
  }

  return withVersion({
    totalScore: total,
    severityLevel,
    interpretation,
    alerts: alerts.length ? alerts : undefined,
  });
};

export const scorePRIMER5 = (responses: number[]): ScoringResult => {
  const { total, psychosisRisk, flaggedItems } = RE.scorePRIMER5(responses);
  const alerts: string[] = [];

  if (psychosisRisk) {
    alerts.push(
      `Prodromal items scored ≥2: ${flaggedItems.join(", ")}. These warrant detailed clinical evaluation.`,
    );
  }

  let severityLevel: string;
  let interpretation: string;

  if (total < 6) {
    severityLevel = "Low Risk";
    interpretation = "Low prodromal symptoms. No immediate psychosis risk concern. Continue routine monitoring if clinically indicated.";
  } else if (total < 10) {
    severityLevel = "Moderate Risk";
    interpretation = "Moderate prodromal symptoms present. Consider follow-up assessment and monitor for symptom progression.";
  } else if (total < 18) {
    severityLevel = "High Risk";
    interpretation = "High prodromal symptom severity (score ≥10). Consider referral to a specialised early psychosis intervention service.";
    alerts.push("Total score ≥10 indicates need for comprehensive psychosis risk assessment.");
  } else {
    severityLevel = "Very High Risk";
    interpretation = "Very high prodromal symptom severity. Urgent comprehensive psychiatric evaluation required.";
    alerts.push("URGENT: Very high prodromal psychosis risk. Immediate specialist evaluation recommended.");
  }

  return withVersion({
    totalScore: total,
    severityLevel,
    interpretation,
    alerts: alerts.length ? alerts : undefined,
  });
};

