/**
 * Server-side mirror of the deterministic clinical rules engine.
 * Keep in sync with src/lib/clinical/rulesEngine.ts — same version string.
 * NO AI is involved in any function here.
 */

export const RULES_ENGINE_VERSION = "1.0.0";
export const MHGAP_VERSION = "mhGAP-IG v2.0 (2016)";
export const AI_LAYER_LABEL =
  "AI-extracted entities — scores and pathways calculated deterministically.";

export type CrisisPathwayType =
  | "active-suicidality"
  | "psychotic-agitation"
  | "dfv"
  | "command-hallucinations"
  | "child-safety"
  | "substance-crisis"
  | "safeguarding"
  | "none";

export interface CrisisPathwayResult {
  pathwayType: CrisisPathwayType;
  urgency: "immediate" | "urgent" | "routine";
  requiredActions: string[];
  triggeredBy: string[];
  blocksSessionClosure: boolean;
}

const GROUPS: { pathway: CrisisPathwayType; urgency: "immediate" | "urgent"; keys: string[] }[] = [
  { pathway: "command-hallucinations", urgency: "immediate", keys: ["command-hallucination", "command hallucinations", "voices telling"] },
  { pathway: "psychotic-agitation", urgency: "immediate", keys: ["psychotic-agitation", "agitation", "violent", "homicidal"] },
  { pathway: "child-safety", urgency: "immediate", keys: ["child-safety", "child abuse", "child neglect", "minor at risk"] },
  { pathway: "dfv", urgency: "urgent", keys: ["dfv", "gbv", "domestic violence", "intimate partner violence"] },
  { pathway: "substance-crisis", urgency: "urgent", keys: ["substance-crisis", "overdose", "withdrawal"] },
  { pathway: "safeguarding", urgency: "urgent", keys: ["safeguarding", "abuse", "neglect", "exploitation"] },
];

export function determineCrisisPathway(inputs: {
  phq9Item9?: number;
  psqTotal?: number;
  pcl5Total?: number;
  narrativeFlags?: string[];
}): CrisisPathwayResult {
  const flags = (inputs.narrativeFlags ?? []).map((f) => String(f).toLowerCase());
  const phq9Item9 = Number(inputs.phq9Item9) || 0;
  const psqTotal = Number(inputs.psqTotal) || 0;
  const pcl5Total = Number(inputs.pcl5Total) || 0;
  const triggeredBy: string[] = [];

  const suicidalFlag = flags.some((f) =>
    ["suicid", "self-harm", "self harm", "kill myself", "moeg vir die lewe", "moedeloos", "tired of life"].some((k) => f.includes(k)),
  );

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
      ],
      triggeredBy,
      blocksSessionClosure: true,
    };
  }

  if (psqTotal >= 3) {
    triggeredBy.push(`PSQ total = ${psqTotal} (>= 3)`);
    return {
      pathwayType: "psychotic-agitation",
      urgency: "immediate",
      requiredActions: [
        "Assess for command hallucinations and risk to self or others",
        "Create an urgent referral to a psychiatrist or emergency centre",
      ],
      triggeredBy,
      blocksSessionClosure: true,
    };
  }

  for (const g of GROUPS) {
    const hit = flags.find((f) => g.keys.some((k) => f.includes(k)));
    if (hit) {
      triggeredBy.push(`Narrative risk flag: ${hit}`);
      return {
        pathwayType: g.pathway,
        urgency: g.urgency,
        requiredActions: [
          "Document the disclosure verbatim",
          "Create a referral to the appropriate protective or clinical service",
          "Notify the supervising clinician / safety monitor",
        ],
        triggeredBy,
        blocksSessionClosure: g.urgency === "immediate",
      };
    }
  }

  if (pcl5Total >= 33) {
    triggeredBy.push(`PCL-5 total = ${pcl5Total} (>= 33)`);
    return {
      pathwayType: "safeguarding",
      urgency: "urgent",
      requiredActions: ["Assess ongoing exposure to the traumatic context", "Refer for trauma-focused assessment"],
      triggeredBy,
      blocksSessionClosure: false,
    };
  }

  return { pathwayType: "none", urgency: "routine", requiredActions: [], triggeredBy, blocksSessionClosure: false };
}

/** Strip any dosage-like string an LLM may have produced. Defence in depth. */
const DOSAGE_PATTERN =
  /\b\d+(?:\.\d+)?\s?(?:mg|mcg|µg|g|ml|iu)\b(?:\s?(?:od|bd|tds|qds|daily|nocte|bid|tid))?/gi;

export function scrubDosages<T>(value: T): T {
  if (typeof value === "string") {
    return value.replace(DOSAGE_PATTERN, "[dosage removed — prescriber decision]") as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((v) => scrubDosages(v)) as unknown as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = scrubDosages(v);
    }
    return out as T;
  }
  return value;
}
