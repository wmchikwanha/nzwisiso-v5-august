/**
 * Self-Assessment i18n
 *
 * Registers every locale used by the Self-Assessment flow.
 * Missing keys fall back to English.
 */

import type { SelfAssessStrings } from './types';
import { isRTL } from './types';

import en from './locales/en';
import sn from './locales/sn';
import nd from './locales/nd';
import st from './locales/st';
import zu from './locales/zu';
import xh from './locales/xh';
import af from './locales/af';
import sw from './locales/sw';
import fr from './locales/fr';
import pt from './locales/pt';
import ur from './locales/ur';
import ar from './locales/ar';

const STRINGS: Record<string, SelfAssessStrings> = {
  en, sn, nd, st, zu, xh, af, sw, fr, pt, ur, ar,
};

/** Get the strings dictionary for a language, with English fallback. */
export function getStrings(lang: string): SelfAssessStrings {
  return STRINGS[lang] ?? en;
}

export const EN_STRINGS = en;

export type { SelfAssessStrings } from './types';
export { isRTL } from './types';

/** Full list of supported self-assessment language codes. */
export const SELF_ASSESS_LANGS = Object.keys(STRINGS);

/** Human-readable language names for the self-assessment picker. */
export const SELF_ASSESS_LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  sn: 'Shona',
  nd: 'Ndebele',
  st: 'Sesotho',
  zu: 'isiZulu',
  xh: 'isiXhosa',
  af: 'Afrikaans',
  sw: 'Kiswahili',
  fr: 'Français',
  pt: 'Português',
  ur: 'اردو (Urdu)',
  ar: 'العربية (Arabic)',
};
