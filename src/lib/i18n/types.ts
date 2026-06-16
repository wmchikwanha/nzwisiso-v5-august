/**
 * Self-Assessment i18n
 *
 * Single source of truth for all UI strings shown in /self-assess.
 * Baseline language is English. Any missing key in another locale falls
 * back to English, so a half-translated locale never breaks the UI.
 *
 * To add a new locale: add an entry to STRINGS keyed by the BCP-47 code
 * already declared in src/lib/languages.ts and translate as many keys
 * as you can. Missing keys auto-fall-back.
 *
 * RTL languages should be listed in RTL_LANGS below so the SelfAssess
 * page applies dir="rtl".
 */

export const RTL_LANGS = new Set(['ur', 'ar']);

export const isRTL = (lang: string) => RTL_LANGS.has(lang);

export interface SelfAssessStrings {
  header: { title: string; subtitle: string; confidential: string };
  progress: (current: number, total: number) => string;
  crisis: {
    banner: string;
    services: { befrienders: string; sadag: string; lifeline: string; emergency: string };
  };
  welcome: {
    title: string;
    description: string;
    expectHeading: string;
    expect: string[];
    notEmergencyTitle: string;
    notEmergencyBody: string;
    languageLabel: string;
    startButton: string;
  };
  consent: {
    title: string;
    description: string;
    backButton: string;
    continueButton: string;
    items: {
      screening_disclaimer: string;
      data_sharing: string;
      emergency_understanding: string;
      voluntary_participation: string;
      age_confirmation: string;
      research_opt_in: string;
    };
  };
  demographics: {
    title: string;
    description: string;
    ageLabel: string;
    agePlaceholder: string;
    genderLabel: string;
    genderPlaceholder: string;
    regionLabel: string;
    regionPlaceholder: string;
    genders: { male: string; female: string; nonBinary: string; preferNot: string };
    continueButton: string;
  };
  screening: {
    title: string;
    description: string;
    safetyBadge: string;
    questions: string[];
    likert: string[];
    continueButton: string;
  };
  narrative: {
    title: string;
    description: string;
    placeholder: string;
    speak: string;
    stop: string;
    upload: string;
    acceptedFiles: string;
    submitWithText: string;
    submitWithoutText: string;
  };
  completing: { title: string; body: string };
  result: {
    crisisTitle: string;
    crisisBody: string;
    completeTitle: string;
    completeBody: string;
    recommendedTitle: string;
    recommendedDescription: string;
    emergencyCapable: string;
    websiteLabel: string;
    noFacilitiesBody: string;
    inMeantime: string;
    referralTitle: string;
    referralDescription: string;
    referralIdLabel: string;
    pinLabel: string;
    copy: string;
    saveWarningTitle: string;
    saveWarningBody: string;
    checkStatusButton: string;
    nextTitle: string;
    nextStep1: string;
    nextStep2: string;
    nextStep3: string;
    facilityCtaPrompt: string;
    facilityCtaBody: string;
    facilityCtaButton: string;
    homeButton: string;
  };
}
