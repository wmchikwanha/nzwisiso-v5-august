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

const en: SelfAssessStrings = {
  header: {
    title: 'Nzwisiso',
    subtitle: 'Mental Health Self-Assessment',
    confidential: 'Confidential',
  },
  progress: (c, t) => `Step ${c} of ${t}`,
  crisis: {
    banner: 'If you are in immediate danger, please contact emergency services now',
    services: {
      befrienders: 'Befrienders Zimbabwe',
      sadag: 'SADAG (South Africa)',
      lifeline: 'Lifeline',
      emergency: 'Emergency Services',
    },
  },
  welcome: {
    title: 'Mental Health Self-Assessment',
    description:
      'This free, confidential tool helps you understand your mental wellbeing and connects you with mental health professionals in your area.',
    expectHeading: 'What to expect:',
    expect: [
      'A short screening questionnaire (about 5 minutes)',
      'Option to share your story by voice, text, or document upload',
      'Confidential matching to mental health services near you',
      'No personal identifying information is stored',
    ],
    notEmergencyTitle: 'This is NOT an emergency service',
    notEmergencyBody:
      'If you are in immediate danger or having thoughts of harming yourself, please call emergency services (112) or go to your nearest emergency room.',
    languageLabel: 'Preferred language',
    startButton: 'Begin Self-Assessment',
  },
  consent: {
    title: 'Consent & Safety Information',
    description: 'Please read and agree to the following before continuing.',
    backButton: 'Back',
    continueButton: 'I Agree & Continue',
    items: {
      screening_disclaimer:
        'I understand this is a mental health screening tool only, NOT a diagnosis or medical advice. Results will help connect me with appropriate mental health services.',
      data_sharing:
        'I consent to my anonymised responses being shared with matched mental health facilities to facilitate a referral.',
      emergency_understanding:
        'I understand that in a medical emergency, I should call emergency services (112) or go to my nearest emergency room immediately. This tool is NOT an emergency service.',
      voluntary_participation:
        'I confirm I am completing this assessment voluntarily and that my responses are truthful to the best of my knowledge.',
      age_confirmation:
        "I confirm I am 18 years of age or older, or I am completing this with a parent/guardian's knowledge.",
      research_opt_in:
        'I optionally consent to my fully anonymised data being used for mental health research to improve services in my region.',
    },
  },
  demographics: {
    title: 'About You',
    description:
      'Help us match you with the right services. No identifying information is stored.',
    ageLabel: 'Age range',
    agePlaceholder: 'Select age range',
    genderLabel: 'Gender',
    genderPlaceholder: 'Select gender',
    regionLabel: 'Region / Province',
    regionPlaceholder: 'Select your region',
    genders: { male: 'Male', female: 'Female', nonBinary: 'Non-binary', preferNot: 'Prefer not to say' },
    continueButton: 'Continue to Screening',
  },
  screening: {
    title: 'How Have You Been Feeling?',
    description:
      'Over the last 2 weeks, how often have you been bothered by any of the following problems?',
    safetyBadge: 'Safety question',
    questions: [
      'Little interest or pleasure in doing things',
      'Feeling down, depressed, or hopeless',
      'Trouble falling or staying asleep, or sleeping too much',
      'Feeling tired or having little energy',
      'Poor appetite or overeating',
      'Feeling bad about yourself — or that you are a failure or have let yourself or your family down',
      'Trouble concentrating on things, such as reading or watching television',
      'Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless',
      'Thoughts that you would be better off dead, or of hurting yourself in some way',
    ],
    likert: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
    continueButton: 'Continue',
  },
  narrative: {
    title: 'Tell Us More (Optional)',
    description:
      "Share anything else about how you've been feeling. You can type, speak, or upload documents from previous appointments.",
    placeholder: "Describe what's been on your mind, any symptoms, or concerns you'd like help with...",
    speak: 'Speak',
    stop: 'Stop Recording',
    upload: 'Upload Document',
    acceptedFiles: 'Accepted: PDF, images (JPG, PNG), or text files from previous appointments.',
    submitWithText: 'Submit & Get Results',
    submitWithoutText: 'Skip & Get Results',
  },
  completing: {
    title: 'Processing your assessment...',
    body: "We're matching you with mental health services in your area.",
  },
  result: {
    crisisTitle: 'Immediate Support Available',
    crisisBody:
      'Based on your responses, we strongly recommend you speak with someone right away. Please contact one of the services below or go to your nearest emergency room.',
    completeTitle: 'Assessment Complete',
    completeBody:
      "Thank you for completing this self-assessment. Based on your responses, we've identified mental health services that may be able to help you.",
    recommendedTitle: 'Recommended Services Near You',
    recommendedDescription:
      'These facilities have been notified of your referral. You can also contact them directly.',
    emergencyCapable: 'Emergency capable',
    websiteLabel: 'Website',
    noFacilitiesBody:
      'No facilities are currently registered in your region. Your assessment has been recorded and you will be contacted when services become available.',
    inMeantime: 'In the meantime, you can reach out to:',
    referralTitle: 'Your Referral ID — write this down now',
    referralDescription:
      'This is the only way to follow up anonymously. We cannot recover your PIN if you lose it.',
    referralIdLabel: 'Referral ID',
    pinLabel: 'Verification PIN',
    copy: 'Copy',
    saveWarningTitle: '⚠ Save these before closing this page',
    saveWarningBody: 'Screenshot, write down, or copy them. They will not be shown again.',
    checkStatusButton: 'Check status or message your facility',
    nextTitle: 'What Happens Next?',
    nextStep1: 'Your matched facility has been notified of your anonymous referral.',
    nextStep2:
      'Visit, call, or email the facility and quote your Referral ID + PIN — they will pull up your assessment immediately.',
    nextStep3:
      "If it's not urgent, please follow up within 14 days. You can also return here any time to check status, message the facility, or share contact details if you'd like them to reach out directly.",
    facilityCtaPrompt: 'Are you a mental health facility?',
    facilityCtaBody:
      'Register your facility on Nzwisiso to receive self-referrals and connect with patients in your region.',
    facilityCtaButton: 'Register Your Facility',
    homeButton: 'Return to Home',
  },
};

// Urdu — full translation (RTL)
const ur: SelfAssessStrings = {
  header: {
    title: 'نزوسیسو',
    subtitle: 'ذہنی صحت کا خود جائزہ',
    confidential: 'خفیہ',
  },
  progress: (c, t) => `مرحلہ ${c} از ${t}`,
  crisis: {
    banner: 'اگر آپ کو فوری خطرہ لاحق ہے تو براہ کرم ابھی ایمرجنسی سروسز سے رابطہ کریں',
    services: {
      befrienders: 'بیفرینڈرز زمبابوے',
      sadag: 'SADAG (جنوبی افریقہ)',
      lifeline: 'لائف لائن',
      emergency: 'ایمرجنسی سروسز',
    },
  },
  welcome: {
    title: 'ذہنی صحت کا خود جائزہ',
    description:
      'یہ مفت، خفیہ ٹول آپ کو اپنی ذہنی صحت کو سمجھنے میں مدد دیتا ہے اور آپ کو آپ کے علاقے میں ذہنی صحت کے ماہرین سے جوڑتا ہے۔',
    expectHeading: 'کیا توقع کریں:',
    expect: [
      'ایک مختصر اسکریننگ سوالنامہ (تقریباً 5 منٹ)',
      'اپنی کہانی آواز، متن، یا دستاویز اپ لوڈ کے ذریعے شیئر کرنے کا اختیار',
      'آپ کے قریب ذہنی صحت کی خدمات سے خفیہ ملاپ',
      'کوئی ذاتی شناختی معلومات محفوظ نہیں کی جاتی',
    ],
    notEmergencyTitle: 'یہ ایمرجنسی سروس نہیں ہے',
    notEmergencyBody:
      'اگر آپ کو فوری خطرہ لاحق ہے یا آپ خود کو نقصان پہنچانے کے بارے میں سوچ رہے ہیں، تو براہ کرم ایمرجنسی سروسز (112) کو کال کریں یا اپنے قریبی ایمرجنسی روم جائیں۔',
    languageLabel: 'ترجیحی زبان',
    startButton: 'خود جائزہ شروع کریں',
  },
  consent: {
    title: 'رضامندی اور حفاظتی معلومات',
    description: 'جاری رکھنے سے پہلے براہ کرم درج ذیل کو پڑھیں اور اتفاق کریں۔',
    backButton: 'واپس',
    continueButton: 'میں متفق ہوں اور جاری رکھتا ہوں',
    items: {
      screening_disclaimer:
        'میں سمجھتا/سمجھتی ہوں کہ یہ صرف ذہنی صحت کا اسکریننگ ٹول ہے، تشخیص یا طبی مشورہ نہیں۔ نتائج مجھے مناسب ذہنی صحت کی خدمات سے جوڑنے میں مدد دیں گے۔',
      data_sharing:
        'میں اپنے گمنام جوابات کو ریفرل کی سہولت کے لیے متعلقہ ذہنی صحت کی سہولیات کے ساتھ شیئر کرنے کی اجازت دیتا/دیتی ہوں۔',
      emergency_understanding:
        'میں سمجھتا/سمجھتی ہوں کہ طبی ایمرجنسی میں مجھے فوری طور پر ایمرجنسی سروسز (112) کو کال کرنا یا اپنے قریبی ایمرجنسی روم جانا چاہیے۔ یہ ٹول ایمرجنسی سروس نہیں ہے۔',
      voluntary_participation:
        'میں تصدیق کرتا/کرتی ہوں کہ میں یہ جائزہ رضاکارانہ طور پر مکمل کر رہا/رہی ہوں اور میرے جوابات میرے علم کے مطابق سچے ہیں۔',
      age_confirmation:
        'میں تصدیق کرتا/کرتی ہوں کہ میری عمر 18 سال یا اس سے زیادہ ہے، یا میں اپنے والدین/سرپرست کے علم میں یہ مکمل کر رہا/رہی ہوں۔',
      research_opt_in:
        'میں اختیاری طور پر اجازت دیتا/دیتی ہوں کہ میرے مکمل طور پر گمنام ڈیٹا کو میرے علاقے میں خدمات کو بہتر بنانے کے لیے ذہنی صحت کی تحقیق کے لیے استعمال کیا جائے۔',
    },
  },
  demographics: {
    title: 'آپ کے بارے میں',
    description:
      'ہمیں آپ کو صحیح خدمات سے جوڑنے میں مدد کریں۔ کوئی شناختی معلومات محفوظ نہیں کی جاتی۔',
    ageLabel: 'عمر کی حد',
    agePlaceholder: 'عمر کی حد منتخب کریں',
    genderLabel: 'جنس',
    genderPlaceholder: 'جنس منتخب کریں',
    regionLabel: 'علاقہ / صوبہ',
    regionPlaceholder: 'اپنا علاقہ منتخب کریں',
    genders: { male: 'مرد', female: 'عورت', nonBinary: 'غیر ثنائی', preferNot: 'بتانا نہیں چاہتا/چاہتی' },
    continueButton: 'اسکریننگ جاری رکھیں',
  },
  screening: {
    title: 'آپ کیسا محسوس کر رہے ہیں؟',
    description:
      'پچھلے 2 ہفتوں کے دوران، آپ درج ذیل میں سے کسی مسئلے سے کتنی بار پریشان ہوئے ہیں؟',
    safetyBadge: 'حفاظتی سوال',
    questions: [
      'چیزیں کرنے میں کم دلچسپی یا خوشی',
      'اداس، افسردہ، یا ناامید محسوس کرنا',
      'نیند آنے یا برقرار رکھنے میں مشکل، یا بہت زیادہ سونا',
      'تھکاوٹ محسوس کرنا یا توانائی کی کمی',
      'بھوک کم لگنا یا زیادہ کھانا',
      'اپنے بارے میں برا محسوس کرنا — یا کہ آپ ناکام ہیں یا آپ نے اپنے آپ کو یا اپنے خاندان کو مایوس کیا ہے',
      'چیزوں پر توجہ مرکوز کرنے میں مشکل، جیسے پڑھنا یا ٹیلی ویژن دیکھنا',
      'اتنی آہستہ حرکت یا بات کرنا کہ دوسرے لوگ غور کر سکیں؟ یا اس کے برعکس — اتنا بے چین یا مضطرب ہونا',
      'یہ خیالات کہ آپ مر جائیں تو بہتر ہو گا، یا اپنے آپ کو کسی طرح نقصان پہنچانے کے',
    ],
    likert: ['بالکل نہیں', 'کئی دن', 'آدھے سے زیادہ دن', 'تقریباً ہر روز'],
    continueButton: 'جاری رکھیں',
  },
  narrative: {
    title: 'مزید بتائیں (اختیاری)',
    description:
      'آپ کیسا محسوس کر رہے ہیں اس کے بارے میں مزید کچھ شیئر کریں۔ آپ ٹائپ کر سکتے ہیں، بول سکتے ہیں، یا پچھلی ملاقاتوں کی دستاویزات اپ لوڈ کر سکتے ہیں۔',
    placeholder: 'بتائیں کہ آپ کے ذہن میں کیا ہے، کوئی علامات، یا تشویش جس میں آپ مدد چاہتے ہیں...',
    speak: 'بولیں',
    stop: 'ریکارڈنگ روکیں',
    upload: 'دستاویز اپ لوڈ کریں',
    acceptedFiles: 'قبول کیا جاتا ہے: PDF، تصاویر (JPG، PNG)، یا پچھلی ملاقاتوں کی متنی فائلیں۔',
    submitWithText: 'جمع کرائیں اور نتائج حاصل کریں',
    submitWithoutText: 'چھوڑیں اور نتائج حاصل کریں',
  },
  completing: {
    title: 'آپ کے جائزے پر کارروائی ہو رہی ہے...',
    body: 'ہم آپ کو آپ کے علاقے میں ذہنی صحت کی خدمات سے جوڑ رہے ہیں۔',
  },
  result: {
    crisisTitle: 'فوری مدد دستیاب',
    crisisBody:
      'آپ کے جوابات کی بنیاد پر، ہم پرزور سفارش کرتے ہیں کہ آپ فوراً کسی سے بات کریں۔ براہ کرم ذیل میں سے کسی خدمت سے رابطہ کریں یا اپنے قریبی ایمرجنسی روم جائیں۔',
    completeTitle: 'جائزہ مکمل',
    completeBody:
      'یہ خود جائزہ مکمل کرنے کا شکریہ۔ آپ کے جوابات کی بنیاد پر، ہم نے ذہنی صحت کی ایسی خدمات کی نشاندہی کی ہے جو آپ کی مدد کر سکتی ہیں۔',
    recommendedTitle: 'آپ کے قریب تجویز کردہ خدمات',
    recommendedDescription:
      'ان سہولیات کو آپ کے ریفرل کی اطلاع دے دی گئی ہے۔ آپ ان سے براہ راست بھی رابطہ کر سکتے ہیں۔',
    emergencyCapable: 'ایمرجنسی صلاحیت',
    websiteLabel: 'ویب سائٹ',
    noFacilitiesBody:
      'آپ کے علاقے میں فی الحال کوئی سہولیات رجسٹرڈ نہیں ہیں۔ آپ کا جائزہ ریکارڈ کر لیا گیا ہے اور جب خدمات دستیاب ہوں گی تو آپ سے رابطہ کیا جائے گا۔',
    inMeantime: 'اس دوران، آپ ان سے رابطہ کر سکتے ہیں:',
    referralTitle: 'آپ کا ریفرل ID — ابھی لکھ لیں',
    referralDescription:
      'گمنام پیروی کے لیے یہی واحد طریقہ ہے۔ اگر آپ اپنا پن کھو دیں تو ہم اسے دوبارہ حاصل نہیں کر سکتے۔',
    referralIdLabel: 'ریفرل ID',
    pinLabel: 'تصدیقی پن',
    copy: 'کاپی',
    saveWarningTitle: '⚠ اس صفحے کو بند کرنے سے پہلے انہیں محفوظ کر لیں',
    saveWarningBody: 'اسکرین شاٹ لیں، لکھ لیں، یا کاپی کر لیں۔ یہ دوبارہ نہیں دکھائے جائیں گے۔',
    checkStatusButton: 'حالت چیک کریں یا اپنی سہولت کو پیغام بھیجیں',
    nextTitle: 'اب کیا ہوگا؟',
    nextStep1: 'آپ کی متعلقہ سہولت کو آپ کے گمنام ریفرل کی اطلاع دے دی گئی ہے۔',
    nextStep2:
      'سہولت پر جائیں، کال کریں، یا ای میل کریں اور اپنا ریفرل ID + پن بتائیں — وہ آپ کا جائزہ فوراً نکال لیں گے۔',
    nextStep3:
      'اگر یہ فوری نہیں ہے، تو براہ کرم 14 دنوں کے اندر پیروی کریں۔ آپ یہاں کسی بھی وقت واپس آ کر حالت چیک کر سکتے ہیں، سہولت کو پیغام بھیج سکتے ہیں، یا اگر چاہیں تو رابطے کی تفصیلات شیئر کر سکتے ہیں۔',
    facilityCtaPrompt: 'کیا آپ ذہنی صحت کی سہولت ہیں؟',
    facilityCtaBody:
      'خود ریفرل وصول کرنے اور اپنے علاقے کے مریضوں سے جڑنے کے لیے نزوسیسو پر اپنی سہولت رجسٹر کریں۔',
    facilityCtaButton: 'اپنی سہولت رجسٹر کریں',
    homeButton: 'ہوم پر واپس جائیں',
  },
};

// Translation dictionary. Add more languages by following the `ur` pattern.
// Missing keys auto-fall-back to English via `t()`.
const STRINGS: Record<string, SelfAssessStrings> = { en, ur };

/** Get the strings dictionary for a language, with English fallback. */
export function getStrings(lang: string): SelfAssessStrings {
  return STRINGS[lang] ?? en;
}

export const EN_STRINGS = en;
