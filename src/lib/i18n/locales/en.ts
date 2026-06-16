/**
 * English (en) - Self-Assessment Locale
 *
 * Baseline language. All other locales fall back to these strings
 * for any missing keys, ensuring a half-translated locale never
 * breaks the UI.
 */

import type { SelfAssessStrings } from '../types';

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

export default en;
