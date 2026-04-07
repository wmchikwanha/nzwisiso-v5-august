/**
 * Role-based permission helpers for graduated UI access.
 * CHWs get a restricted view: record, basic screening (PHQ-9), and upward referral.
 * Psychiatrists and admins get full clinical access.
 */

export type AppRole = "admin" | "psychiatrist" | "chw" | "viewer" | string | null;

const CLINICAL_ROLES: AppRole[] = ["psychiatrist", "admin"];

const isClinical = (role: AppRole): boolean =>
  CLINICAL_ROLES.includes(role as string);

/** Can access diagnostic formulation, AI suggestions, treatment plans */
export const canAccessDiagnostics = (role: AppRole): boolean => isClinical(role);

/** Can trigger Process Narrative (MSE generation) */
export const canProcessNarrative = (role: AppRole): boolean => isClinical(role);

/** Can access full screening battery (GAD-7, PCL-5, MMSE, PSQ, PRIME-R-5) */
export const canAccessFullScreening = (role: AppRole): boolean => isClinical(role);

/** Can access analytics dashboard */
export const canAccessAnalytics = (role: AppRole): boolean => isClinical(role);

/** Can access crisis first aid protocols */
export const canAccessCrisisProtocols = (role: AppRole): boolean => isClinical(role);

/** Can use Ask AI assistant */
export const canAccessAskAI = (role: AppRole): boolean => isClinical(role);

/** Can refer patients upward to a clinician — all roles */
export const canReferUpward = (role: AppRole): boolean => true;

/** Is a CHW (Community Health Worker) */
export const isCHW = (role: AppRole): boolean => role === "chw";

/** Human-readable role label */
export const getRoleLabel = (role: AppRole): string => {
  switch (role) {
    case "admin": return "Administrator";
    case "psychiatrist": return "Psychiatrist";
    case "chw": return "Community Health Worker";
    case "viewer": return "Viewer";
    default: return role || "Unknown";
  }
};
