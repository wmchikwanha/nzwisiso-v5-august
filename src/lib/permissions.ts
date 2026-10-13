/**
 * Role-based permission helpers for graduated UI access.
 * Tiers (low → high): CHW → MH Nurse → Psychiatrist/Clinician → Admin.
 * - CHW: record, PHQ-9, upward referral.
 * - MH Nurse: narrative/MSE, full screening battery, crisis protocols, referral.
 *   No diagnostic formulation, treatment plans, Ask AI, analytics or admin.
 * - Psychiatrist/Admin: full clinical access.
 */

export type AppRole =
  | "admin"
  | "psychiatrist"
  | "mh_nurse"
  | "chw"
  | "viewer"
  | "safety_monitor"
  | "principal_investigator"
  | string
  | null;

const CLINICAL_ROLES: AppRole[] = ["psychiatrist", "admin"];
const NURSE_PLUS: AppRole[] = ["mh_nurse", "psychiatrist", "admin"];

const isClinical = (role: AppRole): boolean => CLINICAL_ROLES.includes(role as string);
const isNursePlus = (role: AppRole): boolean => NURSE_PLUS.includes(role as string);

/** Can access diagnostic formulation, AI suggestions, treatment plans */
export const canAccessDiagnostics = (role: AppRole): boolean => isClinical(role);

/** Can trigger Process Narrative (MSE generation) */
export const canProcessNarrative = (role: AppRole): boolean => isNursePlus(role);

/** Can access full screening battery (GAD-7, PCL-5, MMSE, PSQ, PRIME-R-5) */
export const canAccessFullScreening = (role: AppRole): boolean => isNursePlus(role);

/** Can access analytics dashboard */
export const canAccessAnalytics = (role: AppRole): boolean => isClinical(role);

/** Can access crisis first aid protocols */
export const canAccessCrisisProtocols = (role: AppRole): boolean => isNursePlus(role);

/** Can use Ask AI assistant */
export const canAccessAskAI = (role: AppRole): boolean => isClinical(role);

/** Can refer patients upward to a clinician — all roles */
export const canReferUpward = (_role: AppRole): boolean => true;

/** Is a CHW (Community Health Worker) */
export const isCHW = (role: AppRole): boolean => role === "chw";

/** Is a mental health nurse */
export const isNurse = (role: AppRole): boolean => role === "mh_nurse";

/** Can access the dedicated CHW dashboard */
export const canAccessChwDashboard = (role: AppRole): boolean => role === "chw" || role === "admin";

/** Can manage referral target directory (admins only) */
export const canManageReferralTargets = (role: AppRole): boolean => role === "admin";

/** Can read/play back retained clinical audio — PI and Safety Monitor only */
export const canAccessRetainedAudio = (role: AppRole): boolean =>
  role === "principal_investigator" || role === "safety_monitor";

/** Can export FHIR R4 bundles */
export const canExportFhir = (role: AppRole): boolean =>
  isNursePlus(role) || canAccessRetainedAudio(role);

/** Human-readable role label */
export const getRoleLabel = (role: AppRole): string => {
  switch (role) {
    case "admin": return "Administrator";
    case "psychiatrist": return "Psychiatrist";
    case "mh_nurse": return "Mental Health Nurse";
    case "chw": return "Community Health Worker";
    case "viewer": return "Viewer";
    case "safety_monitor": return "Safety Monitor";
    case "principal_investigator": return "Principal Investigator";
    default: return role || "Unknown";
  }
};
