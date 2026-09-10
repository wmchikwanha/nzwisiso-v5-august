/**
 * DETERMINISTIC CLINICAL RULES ENGINE
 * =================================================================
 * Pure TypeScript. NO AI calls, NO network, NO side effects.
 *
 * Every screening score, severity band, crisis pathway trigger and
 * mhGAP module selection in Nzwisiso is produced HERE — never by a
 * language model. The LLM layer is restricted to extracting clinical
 * entities from narrative text.
 *
 * Any change to the logic in this file MUST be accompanied by a new
 * RULES_ENGINE_VERSION entry and a matching row in rules_engine_versions.
 * =================================================================
 */

export const RULES_ENGINE_VERSION = "1.0.0";
export const SCORING_LOGIC_HASH = "scoring-v1.0.0";
export const PATHWAY_LOGIC_HASH = "pathway-v1.0.0";
export const MHGAP_VERSION = "mhGAP-IG v2.0 (2016)";

/** Label applied to every AI output surface for audit clarity. */
export const AI_LAYER_LABEL =
  "AI-extracted entities — scores and pathways calculated deterministically.";

const sum = (xs: number[]) => xs.reduce((a, b) => a + (Number(b) || 0), 0);

// -----------------------------------------------------------------
// a) PHQ-9
// -----------------------------------------------------------------
export type PHQ9Severity =
  | "minimal"
  | "mild"
  | "moderate"
  | "moderately-severe"
  | "severe";

export interface PHQ9Result {
  total: number;
  severity: PHQ9Severity;
  item9Score: number;
  crisisTriggered: boolean;
}

export function scorePHQ9(responses: number[]): PHQ9Result {
  const total = sum(responses);
  const item9Score = Number(responses[8]) || 0;

  let severity: PHQ9Severity;
  if (total <= 4) severity = "minimal";
  else if (total <= 9) severity = "mild";
  else if (total <= 14) severity = "moderate";
  else if (total <= 19) severity = "moderately-severe";
  else severity = "severe";

  return { total, severity, item9Score, crisisTriggered: item9Score >= 1 };
}

// -----------------------------------------------------------------
// b) GAD-7
// -----------------------------------------------------------------
export type GAD7Severity = "minimal" | "mild" | "moderate" | "severe";

export function scoreGAD7(responses: number[]): { total: number; severity: GAD7Severity } {
  const total = sum(responses);
  let severity: GAD7Severity;
  if (total <= 4) severity = "minimal";
  else if (total <= 9) severity = "mild";
  else if (total <= 14) severity = "moderate";
  else severity = "severe";
  return { total, severity };
}

// -----------------------------------------------------------------
// c) PCL-5
// -----------------------------------------------------------------
export interface PCL5Result {
  total: number;
  provisionalPTSD: boolean;
  /** DSM-5 symptom-cluster criteria, evaluated deterministically. */
  meetsClusterCriteria: boolean;
}

export function scorePCL5(responses: number[]): PCL5Result {
  const total = sum(responses);
  const clusterB = responses.slice(0, 5).filter((r) => r >= 2).length >= 1;
  const clusterC = responses.slice(5, 7).filter((r) => r >= 2).length >= 1;
  const clusterD = responses.slice(7, 14).filter((r) => r >= 2).length >= 2;
  const clusterE = responses.slice(14, 20).filter((r) => r >= 2).length >= 2;
  return {
    total,
    provisionalPTSD: total >= 33,
    meetsClusterCriteria: clusterB && clusterC && clusterD && clusterE,
  };
}

// -----------------------------------------------------------------
// d) MMSE — PROPRIETARY, licence required. Retained for scoring
//    reproducibility of historic records only. Deactivated in the UI.
// -----------------------------------------------------------------
export const MMSE_REQUIRES_LICENCE = true;

export type MMSEImpairment = "none" | "mild" | "moderate" | "severe";

export function scoreMMSE(
  responses: Record<string, number> | number[],
): { total: number; impairment: MMSEImpairment } {
  const values = Array.isArray(responses) ? responses : Object.values(responses);
  const total = sum(values);
  let impairment: MMSEImpairment;
  if (total >= 24) impairment = "none";
  else if (total >= 18) impairment = "mild";
  else if (total >= 10) impairment = "moderate";
  else impairment = "severe";
  return { total, impairment };
}

// -----------------------------------------------------------------
// e) SSQ-14 — Shona Symptom Questionnaire (free, locally validated,
//    Friendship Bench instrument). Replaces MMSE in the battery.
//    14 binary items (0 = no, 1 = yes) over the past week.
//    Validated cut-point for common mental disorder: >= 8.
// -----------------------------------------------------------------
export type SSQ14Severity = "none" | "mild" | "moderate" | "severe";

export interface SSQ14Result {
  total: number;
  severity: SSQ14Severity;
  distressFlag: boolean;
}

export function scoreSSQ14(responses: number[]): SSQ14Result {
  const total = sum(responses);
  let severity: SSQ14Severity;
  if (total <= 4) severity = "none";
  else if (total <= 7) severity = "mild";
  else if (total <= 10) severity = "moderate";
  else severity = "severe";
  return { total, severity, distressFlag: total >= 8 };
}

/** SSQ-14 items — English with the Shona source phrasing preserved. */
export const SSQ14_ITEMS: { en: string; sn: string }[] = [
  { en: "Did you think too much (kufungisisa) in the past week?", sn: "Wakafungisisa here mavhiki apfuura?" },
  { en: "Did you at times feel like committing suicide?", sn: "Pane nguva yawakambofunga kuzviuraya here?" },
  { en: "Did you feel like you were losing your mind?", sn: "Wakanzwa sekunge uri kupenga here?" },
  { en: "Were you failing to concentrate?", sn: "Wakatadza kunyatsoteerera here?" },
  { en: "Did you lose your temper more often?", sn: "Wakatsamwa kakawanda here?" },
  { en: "Did you feel run down (general body weakness)?", sn: "Muviri wako wakaneta here?" },
  { en: "Did you have any complaints of headaches?", sn: "Wakarwadziwa nemusoro here?" },
  { en: "Were you frightened by trivial things?", sn: "Wakavhundutswa nezvinhu zviduku here?" },
  { en: "Did you have trouble sleeping?", sn: "Wakatadza kurara here?" },
  { en: "Did you feel unhappy most of the time?", sn: "Wakanzwa kusafara nguva zhinji here?" },
  { en: "Did you cry more than usual?", sn: "Wakachema kupfuura zvawaisiita here?" },
  { en: "Did you find it difficult to enjoy daily activities?", sn: "Zvawaisifarira hazvichafadzi here?" },
  { en: "Did you have difficulty making decisions?", sn: "Wakaomerwa nekuita sarudzo here?" },
  { en: "Was your work being affected?", sn: "Basa rako rakakanganiswa here?" },
];

// -----------------------------------------------------------------
// f) PSQ — Psychosis Screening Questionnaire
// -----------------------------------------------------------------
export function scorePSQ(responses: number[]): { total: number; crisisTriggered: boolean } {
  const total = sum(responses);
  return { total, crisisTriggered: total >= 3 };
}

// -----------------------------------------------------------------
// g) PRIME-R-5
// -----------------------------------------------------------------
export function scorePRIMER5(responses: number[]): {
  total: number;
  psychosisRisk: boolean;
  flaggedItems: number[];
} {
  const total = sum(responses);
  const flaggedItems = responses
    .map((score, i) => (score >= 2 ? i + 1 : 0))
    .filter((n) => n > 0);
  return { total, psychosisRisk: flaggedItems.length > 0, flaggedItems };
}

// -----------------------------------------------------------------
// h) Crisis pathway determination — HARD-CODED CLINICAL RULES
// -----------------------------------------------------------------
export type CrisisPathwayType =
  | "active-suicidality"
  | "psychotic-agitation"
  | "dfv"
  | "command-hallucinations"
  | "child-safety"
  | "substance-crisis"
  | "safeguarding"
  | "none";

export type CrisisUrgency = "immediate" | "urgent" | "routine";

export interface CrisisPathwayResult {
  pathwayType: CrisisPathwayType;
  urgency: CrisisUrgency;
  requiredActions: string[];
  /** Every rule that fired, for audit reproducibility. */
  triggeredBy: string[];
  blocksSessionClosure: boolean;
}

export interface CrisisPathwayInputs {
  phq9Item9?: number;
  psqTotal?: number;
  pcl5Total?: number;
  /** Free-text risk flags extracted by the NLP layer (never scored by it). */
  narrativeFlags?: string[];
}

const FLAG_GROUPS: { pathway: CrisisPathwayType; urgency: CrisisUrgency; keys: string[] }[] = [
  { pathway: "command-hallucinations", urgency: "immediate", keys: ["command-hallucination", "command hallucinations", "voices telling"] },
  { pathway: "psychotic-agitation", urgency: "immediate", keys: ["psychotic-agitation", "agitation", "violent", "homicidal"] },
  { pathway: "child-safety", urgency: "immediate", keys: ["child-safety", "child abuse", "child neglect", "minor at risk"] },
  { pathway: "dfv", urgency: "urgent", keys: ["dfv", "gbv", "domestic violence", "intimate partner violence"] },
  { pathway: "substance-crisis", urgency: "urgent", keys: ["substance-crisis", "overdose", "withdrawal"] },
  { pathway: "safeguarding", urgency: "urgent", keys: ["safeguarding", "abuse", "neglect", "exploitation"] },
];

export function determineCrisisPathway(inputs: CrisisPathwayInputs): CrisisPathwayResult {
  const flags = (inputs.narrativeFlags ?? []).map((f) => String(f).toLowerCase());
  const triggeredBy: string[] = [];

  const phq9Item9 = Number(inputs.phq9Item9) || 0;
  const psqTotal = Number(inputs.psqTotal) || 0;
  const pcl5Total = Number(inputs.pcl5Total) || 0;

  const suicidalFlag = flags.some((f) =>
    ["suicid", "self-harm", "self harm", "kill myself", "moeg vir die lewe", "moedeloos", "tired of life"].some((k) => f.includes(k)),
  );

  // Rule 1 — active suicidality outranks everything.
  if (phq9Item9 >= 1 || suicidalFlag) {
    if (phq9Item9 >= 1) triggeredBy.push(`PHQ-9 Item 9 = ${phq9Item9} (>= 1)`);
    if (suicidalFlag) triggeredBy.push("Narrative risk flag: suicidal / self-harm statement");
    return {
      pathwayType: "active-suicidality",
      urgency: "immediate",
      requiredActions: [
        "Do not leave the client unattended",
        "Complete the suicidality safety checklist",
        "Create an emergency referral before closing the session",
        "Notify the supervising clinician / safety monitor",
        "Agree a safety plan with the client and a named support person",
      ],
      triggeredBy,
      blocksSessionClosure: true,
    };
  }

  // Rule 2 — psychosis screen at or above threshold.
  if (psqTotal >= 3) {
    triggeredBy.push(`PSQ total = ${psqTotal} (>= 3)`);
    return {
      pathwayType: "psychotic-agitation",
      urgency: "immediate",
      requiredActions: [
        "Assess for command hallucinations and risk to self or others",
        "Create an urgent referral to a psychiatrist or emergency centre",
        "Involve family or a trusted community member for containment",
      ],
      triggeredBy,
      blocksSessionClosure: true,
    };
  }

  // Rule 3 — narrative-driven pathways.
  for (const group of FLAG_GROUPS) {
    const hit = flags.find((f) => group.keys.some((k) => f.includes(k)));
    if (hit) {
      triggeredBy.push(`Narrative risk flag: ${hit}`);
      return {
        pathwayType: group.pathway,
        urgency: group.urgency,
        requiredActions: [
          "Document the disclosure verbatim",
          "Create a referral to the appropriate protective or clinical service",
          "Notify the supervising clinician / safety monitor",
        ],
        triggeredBy,
        blocksSessionClosure: group.urgency === "immediate",
      };
    }
  }

  // Rule 4 — high PTSD burden with a trauma-related flag.
  if (pcl5Total >= 33) {
    triggeredBy.push(`PCL-5 total = ${pcl5Total} (>= 33)`);
    return {
      pathwayType: "safeguarding",
      urgency: "urgent",
      requiredActions: [
        "Assess ongoing exposure to the traumatic context",
        "Refer for trauma-focused assessment",
      ],
      triggeredBy,
      blocksSessionClosure: false,
    };
  }

  return {
    pathwayType: "none",
    urgency: "routine",
    requiredActions: [],
    triggeredBy,
    blocksSessionClosure: false,
  };
}

// -----------------------------------------------------------------
// i) mhGAP module selection — LOOKUP TABLE, not AI-generated.
//    mhGAP-IG v2.0 (2016). NO dosages anywhere in this table.
// -----------------------------------------------------------------
export type MHGAPCategory =
  | "depression"
  | "psychosis"
  | "epilepsy"
  | "substance-use"
  | "developmental-disorders"
  | "behavioural-disorders"
  | "emotional-disorders"
  | "self-harm"
  | "significant-stress"
  | "distress-without-disorder";

export interface MHGAPModule {
  moduleCode: string;
  moduleName: string;
  interventions: string[];
  mhgapVersion: string;
}

const MHGAP_TABLE: Record<MHGAPCategory, Omit<MHGAPModule, "mhgapVersion">> = {
  depression: {
    moduleCode: "DEP",
    moduleName: "Depression",
    interventions: [
      "Psychoeducation for the person and their family",
      "Address current psychosocial stressors",
      "Reactivate social networks and structured daily activity",
      "Brief structured psychological intervention (problem-solving therapy / behavioural activation)",
      "Consider antidepressant medication classes — prescriber decision only, no dosages here",
      "Regular follow-up and monitoring of response and risk",
    ],
  },
  psychosis: {
    moduleCode: "PSY",
    moduleName: "Psychoses",
    interventions: [
      "Urgent assessment by a prescriber for antipsychotic treatment",
      "Psychoeducation and family involvement",
      "Facilitate rehabilitation and community reintegration",
      "Monitor for risk to self and others",
    ],
  },
  epilepsy: {
    moduleCode: "EPI",
    moduleName: "Epilepsy",
    interventions: [
      "Refer for medical assessment and anti-seizure treatment",
      "Seizure safety education for the person and family",
      "Address stigma and school/work participation",
    ],
  },
  "substance-use": {
    moduleCode: "SUB",
    moduleName: "Disorders due to substance use",
    interventions: [
      "Brief intervention and motivational interviewing",
      "Assess for withdrawal risk and refer if unsafe",
      "Link to mutual-help and community recovery support",
    ],
  },
  "developmental-disorders": {
    moduleCode: "CMH-DEV",
    moduleName: "Child & adolescent — developmental disorders",
    interventions: [
      "Parent skills training and caregiver support",
      "Liaise with school for learning support",
      "Assess for co-occurring physical and sensory conditions",
    ],
  },
  "behavioural-disorders": {
    moduleCode: "CMH-BEH",
    moduleName: "Child & adolescent — behavioural disorders",
    interventions: [
      "Parent skills training",
      "Behavioural strategies in the home and classroom",
      "Assess for maltreatment and family stressors",
    ],
  },
  "emotional-disorders": {
    moduleCode: "CMH-EMO",
    moduleName: "Child & adolescent — emotional disorders",
    interventions: [
      "Psychoeducation for the child and caregivers",
      "Address school and family stressors",
      "Brief psychological intervention appropriate to age",
    ],
  },
  "self-harm": {
    moduleCode: "SUI",
    moduleName: "Self-harm / suicide",
    interventions: [
      "Remove access to means of self-harm",
      "Activate carer and community support; do not leave the person alone",
      "Offer and agree a written safety plan",
      "Arrange frequent follow-up contact",
      "Refer urgently to a mental health specialist or emergency service",
    ],
  },
  "significant-stress": {
    moduleCode: "OTH",
    moduleName: "Other significant mental health complaints (stress-related)",
    interventions: [
      "Psychological first aid and stress management",
      "Strengthen social supports and problem-solving",
      "Review after two weeks for symptom persistence",
    ],
  },
  "distress-without-disorder": {
    moduleCode: "OTH-WW",
    moduleName: "Distress without disorder — watchful waiting",
    interventions: [
      "Validate the distress; explain that no disorder threshold has been met",
      "Psychoeducation on stress, sleep and daily routine",
      "Strengthen existing family and community supports",
      "Watchful waiting with a scheduled review in 2–4 weeks",
      "Safety-netting advice: what to look out for and when to return",
    ],
  },
};

export function selectMHGAPModule(
  diagnosticCategory: string,
  severity?: string,
): MHGAPModule {
  const key = String(diagnosticCategory || "")
    .toLowerCase()
    .replace(/[\s_]+/g, "-") as MHGAPCategory;

  const normalisedSeverity = String(severity || "").toLowerCase();
  const subThreshold = ["minimal", "none", "low", "negative screen"].some((s) =>
    normalisedSeverity.includes(s),
  );

  const resolved: MHGAPCategory =
    key in MHGAP_TABLE
      ? subThreshold && key !== "self-harm" && key !== "psychosis"
        ? "distress-without-disorder"
        : key
      : "distress-without-disorder";

  return { ...MHGAP_TABLE[resolved], mhgapVersion: MHGAP_VERSION };
}

/**
 * Map a screening tool + severity onto an mhGAP category, deterministically.
 * Used to pre-select the module BEFORE any LLM call.
 */
export function categoriseFromScreening(
  toolType: string,
  severity: string,
  crisisTriggered = false,
): MHGAPCategory {
  if (crisisTriggered) return "self-harm";
  const s = String(severity || "").toLowerCase();
  const subThreshold = ["minimal", "none", "low", "negative"].some((k) => s.includes(k));
  if (subThreshold) return "distress-without-disorder";

  switch (toolType.toUpperCase().replace(/-/g, "")) {
    case "PHQ9":
      return "depression";
    case "GAD7":
      return "significant-stress";
    case "PCL5":
      return "significant-stress";
    case "PSQ":
    case "PRIMER5":
      return "psychosis";
    case "SSQ14":
      return "depression";
    default:
      return "distress-without-disorder";
  }
}
